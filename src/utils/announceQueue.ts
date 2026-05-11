import { useLocalStorage } from '@vueuse/core'

import { synthesize } from '@/apis/ttsApi'

/**
 * 주문 알림(mp3 + TTS) 단일 직렬 큐.
 *
 * 여러 알림 소스(`useOrderAnnouncer`, `useOrderElapsedAlarm` 등)가 동시에 발화 요청해도
 * 사운드 겹침 없이 enqueue 순서대로 1개씩 처리. 일정 시간 이상 묵은 작업은 폭주 방지를 위해 skip.
 *
 * TTS 는 자체 호스팅 MeloTTS (Spring → /api/tts) 호출 후 HTMLAudio 로 재생.
 * 합성 실패는 silent fail — 큐 진행을 막지 않음 (BELL 등 다른 알림은 계속 들림).
 */

const STORAGE_KEY_STALE_MS = 'announce-stale-ms'
const STALE_MS_DEFAULT = 8_000

/** 큐에서 대기 작업 skip 임계 (ms). localStorage 영속 — 폭주 매장은 값을 줄여 적체 발화 누락 방지. */
export const announceStaleMs = useLocalStorage(STORAGE_KEY_STALE_MS, STALE_MS_DEFAULT)

interface Task {
  fn: () => Promise<void>
  createdAt: number
}

const queue: Task[] = []
let running = false

async function drain() {
  if (running) return
  running = true
  while (queue.length > 0) {
    const t = queue.shift()!
    if (Date.now() - t.createdAt > announceStaleMs.value) continue
    try {
      await t.fn()
    } catch (e) {
      console.warn('[announce] task failed', e)
    }
  }
  running = false
}

/** 알림 작업 enqueue. 즉시 worker 가 시작/이어서 처리. */
export function enqueueAnnounce(fn: () => Promise<void>) {
  queue.push({ fn, createdAt: Date.now() })
  drain()
}

/** 진행 중인 모든 HTMLAudio 인스턴스 — clearAnnounceQueue 에서 즉시 정지용. */
const activeAudios = new Set<HTMLAudioElement>()

/** 큐 + 진행 중 TTS/알림음 모두 즉시 정리. 토글 OFF / unmount 시 호출. */
export function clearAnnounceQueue() {
  queue.length = 0
  for (const a of activeAudios) {
    a.pause()
    a.src = ''
  }
  activeAudios.clear()
}

// ─── 알림 primitives ─────────────────────────────────────────────────

export type Sounds = 'BELL' | 'CRAZY' | 'CLEAR' | 'WELCOME' | 'ALAM_LV1' | 'ALAM_LV2' | 'ALAM_LV3'
const CRAZY_URLS = ['/sounds/마무리.mp3', '/sounds/펜타킬.mp3'] as const
function getURL(sounds: Sounds): string {
  switch (sounds) {
    case 'BELL':
      /** 알림음 — 공백 포함 파일명이라 encodeURI. */
      return encodeURI('/sounds/Door Bell.mp3')
    case 'CRAZY':
      return encodeURI('/sounds/미쳐날뛰고있습니다.mp3')
    case 'CLEAR':
      const url = CRAZY_URLS[Math.floor(Math.random() * 2)] as string
      return encodeURI(url)
    case 'WELCOME':
      return encodeURI('/sounds/소환사협곡환영.mp3')
    case 'ALAM_LV1':
      return encodeURI('/sounds/Bell-level1.mp3')
    case 'ALAM_LV2':
      return encodeURI('/sounds/Bell Sound Ring Sound-level2.mp3')
    case 'ALAM_LV3':
    default:
      return encodeURI('/sounds/Ship Bell Sound-level3.mp3')
  }
}

/** 알림음 1회 재생 후 ended/에러까지 대기. play 차단/로딩 실패 시 silent fallthrough. */
export function playAlert(sounds: Sounds): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(getURL(sounds))
    activeAudios.add(audio)
    const cleanup = () => {
      activeAudios.delete(audio)
      resolve()
    }
    audio.addEventListener('ended', cleanup, { once: true })
    audio.addEventListener('error', cleanup, { once: true })
    audio.play().catch(cleanup)
  })
}

export interface SpeakOptions {
  /** 0.5 ~ 2.0. default 1.0. MeloTTS speed 파라미터로 매핑. */
  rate?: number
  /** 0 ~ 1. default 1. HTMLAudio.volume. */
  volume?: number
  /** normalize 후 서버측 추가 증폭 (dB). 0=보통, 3=크게, 6=매우크게. */
  gainDb?: number
}

// ─── Autoplay unlock ─────────────────────────────────────────────────

let unlocked = false

/**
 * 브라우저 autoplay 정책 우회 — 첫 user gesture 시점에 호출해 HTMLAudio 잠금 해제.
 *
 * - 기존 Door Bell mp3 를 volume=0 로 짧게 play+pause → 이후 `new Audio().play()` 허용
 *
 * idempotent — 이미 unlock 됐으면 no-op.
 */
export function unlockAudio() {
  if (unlocked) return
  unlocked = true

  const audio = new Audio(encodeURI('/sounds/Door Bell.mp3'))
  audio.volume = 0
  audio
    .play()
    .then(() => {
      audio.pause()
      audio.currentTime = 0
    })
    .catch(() => {})
}

// ─── TTS (server-synthesized mp3) ────────────────────────────────────

/**
 * 단기 메모리 캐시 — 같은 (text, speed) 가 짧은 간격으로 반복 발화될 때 (announcerRepeat) 네트워크 0회.
 * 서버 캐시 hit 으로도 빠르지만 로컬에 두면 왕복 자체 제거.
 *
 * 정책: TTL 30s, max 30 entries. 첫 항목부터 (FIFO) 만료/축출.
 */
const BLOB_CACHE_TTL = 30_000
const BLOB_CACHE_MAX = 30
const blobCache = new Map<string, { blob: Blob; expiresAt: number }>()

function getCachedBlob(key: string): Blob | null {
  const e = blobCache.get(key)
  if (!e) return null
  if (e.expiresAt < Date.now()) {
    blobCache.delete(key)
    return null
  }
  return e.blob
}

function setCachedBlob(key: string, blob: Blob) {
  if (blobCache.size >= BLOB_CACHE_MAX) {
    const firstKey = blobCache.keys().next().value
    if (firstKey !== undefined) blobCache.delete(firstKey)
  }
  blobCache.set(key, { blob, expiresAt: Date.now() + BLOB_CACHE_TTL })
}

function playBlob(blob: Blob, volume: number): Promise<void> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.volume = volume
    activeAudios.add(audio)
    const cleanup = () => {
      activeAudios.delete(audio)
      URL.revokeObjectURL(url)
      resolve()
    }
    audio.addEventListener('ended', cleanup, { once: true })
    audio.addEventListener('error', cleanup, { once: true })
    audio.play().catch(cleanup)
  })
}

/**
 * TTS 1회 발화 후 재생 종료까지 대기.
 *
 * 합성/재생 실패는 console.warn 만 남기고 resolve — 큐 진행 차단 X.
 * 동일 (text, speed) 반복 호출은 단기 메모리 캐시 적중으로 네트워크 0회.
 */
export async function speakAsync(text: string, opts: SpeakOptions = {}): Promise<void> {
  const speed = opts.rate ?? 1.0
  const volume = opts.volume ?? 1.0
  const gainDb = opts.gainDb ?? 0
  const key = `${text}|${speed}|${gainDb}`

  try {
    let blob = getCachedBlob(key)
    if (!blob) {
      blob = await synthesize({ text, speed, gainDb })
      setCachedBlob(key, blob)
    }
    await playBlob(blob, volume)
  } catch (e) {
    console.warn('[tts] synthesis/playback failed', e)
  }
}
