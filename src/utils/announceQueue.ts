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
  /** 0.5 ~ 2.0. default 1.0. Google TTS speakingRate 매핑. */
  rate?: number
  /** 0 ~ 1. default 1. HTMLAudio.volume. */
  volume?: number
  /** Google TTS volumeGainDb. 0=보통, 3=크게, 6=매우크게. */
  gainDb?: number
  /** 화자 풀네임 (예: ko-KR-Chirp3-HD-Achernar). 미지정 시 서버 기본값. */
  voice?: string
  /** 클라이언트 메모리 캐시 정책. default 'transient'. */
  tier?: CacheTier
  /**
   * 메모리 캐시 조회/저장 모두 skip. default false.
   *
   * TTS 관리 페이지의 "다시 합성" 전용 — 서버 캐시를 지운 뒤 같은 파라미터로 재요청할 때
   * 메모리에 남은 옛 blob 이 반환되면 재합성 결과를 확인할 수 없다.
   *
   * 브라우저 HTTP 캐시(`max-age=86400`) 도 함께 우회한다 ({@link synthesize}).
   */
  bypassCache?: boolean
  /**
   * 합성/재생 실패 콜백. 미지정 시 기존대로 silent fail (console.warn 만).
   *
   * 주문 알림은 실패해도 조용히 넘어가야 하지만, 관리 화면처럼 사용자가 결과를 기다리는
   * 화면에서는 실패를 알려야 한다.
   */
  onError?: (e: unknown) => void
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
 * 클라이언트 메모리 캐시 — 3-tier.
 *
 * - {@link pinnedBlobCache}: 변동 없는 텍스트 (매장명, "N분 경과", "주문 수정" 등). 축출 없음, 페이지 reload 까지 영구.
 * - {@link warmBlobCache}: 가끔 쓰는 고정 텍스트 (발화 프리셋 등). max 10 entries **LRU**.
 * - {@link blobCache}: 가변 텍스트 (메뉴 조합 등). max 30 entries **LRU** — 자주 나가는 메뉴가 상위에 남음.
 *
 * 모두 miss 시 서버(Spring 디스크 캐시 200MB) → Google. 서버 hit 도 빠르지만 메모리는 왕복 자체 제거.
 */
const BLOB_CACHE_MAX = 30
const WARM_CACHE_MAX = 10
const blobCache = new Map<string, Blob>()
const warmBlobCache = new Map<string, Blob>()
const pinnedBlobCache = new Map<string, Blob>()

export type CacheTier = 'pinned' | 'warm' | 'transient'

function getCachedBlob(key: string): Blob | null {
  const pinned = pinnedBlobCache.get(key)
  if (pinned) return pinned

  const warm = warmBlobCache.get(key)
  if (warm) {
    // LRU 갱신 — 끝으로 이동
    warmBlobCache.delete(key)
    warmBlobCache.set(key, warm)
    return warm
  }

  const transient = blobCache.get(key)
  if (transient) {
    // LRU 갱신
    blobCache.delete(key)
    blobCache.set(key, transient)
    return transient
  }

  return null
}

function setCachedBlob(key: string, blob: Blob, tier: CacheTier) {
  if (tier === 'pinned') {
    pinnedBlobCache.set(key, blob)
    return
  }
  if (tier === 'warm') {
    if (warmBlobCache.size >= WARM_CACHE_MAX && !warmBlobCache.has(key)) {
      const oldest = warmBlobCache.keys().next().value
      if (oldest !== undefined) warmBlobCache.delete(oldest)
    }
    warmBlobCache.delete(key)
    warmBlobCache.set(key, blob)
    return
  }
  if (blobCache.size >= BLOB_CACHE_MAX && !blobCache.has(key)) {
    const firstKey = blobCache.keys().next().value
    if (firstKey !== undefined) blobCache.delete(firstKey)
  }
  blobCache.set(key, blob)
}

/** 3-tier 전체에서 해당 key 제거 — 재합성 시 옛 blob 잔존 방지. */
function invalidateCachedBlob(key: string) {
  pinnedBlobCache.delete(key)
  warmBlobCache.delete(key)
  blobCache.delete(key)
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

/** 단일 (text, opts) 의 mp3 blob 확보 — 메모리 캐시 hit 또는 서버 합성. */
async function fetchSpeechBlob(
  text: string,
  speed: number,
  /** 데시벨 증폭률 */
  gainDb: number,
  voice: string,
  tier: CacheTier,
  bypassCache = false,
): Promise<Blob> {
  // 화자, ㅂ
  const key = `${text}|${speed}|${gainDb}|${voice}`
  if (bypassCache) {
    // 모든 tier 에서 제거 — 안 그러면 pinned 에 남은 옛 blob 이 이후 조회에서 계속 이긴다.
    invalidateCachedBlob(key)
  } else {
    const cached = getCachedBlob(key)
    if (cached) return cached
  }

  const blob = await synthesize({ text, speed, gainDb, voice: voice || undefined, bypassCache })
  // bypass 요청은 저장도 하지 않는다 — 어차피 다음에도 서버까지 가므로 LRU 자리만 차지하고,
  // 무엇보다 관리 화면 발화가 프리셋/알림용 blob 을 밀어내면 안 된다.
  if (!bypassCache) setCachedBlob(key, blob, tier)
  return blob
}

/** 발화 파트 정의. {@link speakSequence} 의 단위. */
export interface SpeechPart {
  text: string
  /** 캐시 정책. default 'transient'. */
  tier?: CacheTier
}

/**
 * TTS 1회 발화 후 재생 종료까지 대기.
 *
 * 합성/재생 실패는 console.warn 만 남기고 resolve — 큐 진행 차단 X.
 * {@link SpeakOptions.tier} 로 캐시 정책 지정 — 프리셋/직접입력 같은 재사용 텍스트는 'warm', 일회성은 default.
 */
export async function speakAsync(text: string, opts: SpeakOptions = {}): Promise<void> {
  const speed = opts.rate ?? 1.0
  const volume = opts.volume ?? 1.0
  const gainDb = opts.gainDb ?? 0
  const voice = opts.voice ?? ''
  const tier = opts.tier ?? 'transient'
  try {
    const blob = await fetchSpeechBlob(text, speed, gainDb, voice, tier, opts.bypassCache)
    await playBlob(blob, volume)
  } catch (e) {
    console.warn('[tts] synthesis/playback failed', e)
    opts.onError?.(e)
  }
}

/**
 * 여러 파트를 순서대로 합성 → mp3 binary 이어붙여 **단일 Audio 로 재생**.
 *
 * 각 파트는 독립 캐시 항목이라 hit 율 ↑ (예: 매장명은 1종, 메뉴 조합만 변동).
 * 파트별 {@link SpeechPart.tier} 로 메모리 캐시 정책 분리 — 매장명/경과시간 'pinned', 메뉴 default(transient).
 * 재생은 단일 HTMLAudio 라 세그먼트 사이 setup latency 없음 — 통문장과 동일한 매끄러움.
 * mp3 frame self-contained 특성으로 binary concat 후 재인코딩 불필요.
 */
export async function speakSequence(parts: SpeechPart[], opts: SpeakOptions = {}): Promise<void> {
  if (parts.length === 0) return
  const speed = opts.rate ?? 1.0
  const volume = opts.volume ?? 1.0
  const gainDb = opts.gainDb ?? 0
  const voice = opts.voice ?? ''
  try {
    const blobs: Blob[] = []
    for (const p of parts) {
      if (!p.text) continue
      blobs.push(await fetchSpeechBlob(p.text, speed, gainDb, voice, p.tier ?? 'transient'))
    }
    if (blobs.length === 0) return
    const combined = blobs.length === 1 ? blobs[0]! : new Blob(blobs, { type: 'audio/mpeg' })
    await playBlob(combined, volume)
  } catch (e) {
    console.warn('[tts] sequence failed', e)
  }
}
