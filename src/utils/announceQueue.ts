/**
 * 주문 알림(mp3 + TTS) 단일 직렬 큐.
 *
 * 여러 알림 소스(`useOrderAnnouncer`, `useOrderThresholdAlert` 등)가 동시에 발화 요청해도
 * 사운드 겹침 없이 enqueue 순서대로 1개씩 처리. 5초 이상 묵은 작업은 폭주 방지를 위해 skip.
 */

const STALE_MS = 5_000

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
    if (Date.now() - t.createdAt > STALE_MS) continue
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

/** 큐 + 진행 중 TTS 모두 즉시 정리. 토글 OFF / unmount 시 호출.
 *  진행 중 mp3 (Audio 인스턴스) 는 자체 lifecycle 종료까지 두는 정책. */
export function clearAnnounceQueue() {
  queue.length = 0
  speechSynthesis.cancel()
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
    audio.addEventListener('ended', () => resolve(), { once: true })
    audio.addEventListener('error', () => resolve(), { once: true })
    audio.play().catch(() => resolve())
  })
}

export interface SpeakOptions {
  /** 0.1 ~ 10. default 1. */
  rate?: number
  /** 0 ~ 2. default 1. */
  pitch?: number
  /** 0 ~ 1. default 1. */
  volume?: number
  /** 미지정 시 OS 기본 한국어 화자. */
  voice?: SpeechSynthesisVoice | null
}

// ─── Autoplay unlock ─────────────────────────────────────────────────

let unlocked = false

/**
 * 브라우저 autoplay 정책 우회 — 첫 user gesture 시점에 호출해 HTMLAudio + SpeechSynthesis 를 잠금 해제.
 *
 * - HTMLAudio: 기존 Door Bell mp3 를 volume=0 로 짧게 play+pause → 이후 `new Audio().play()` 허용
 * - SpeechSynthesis: 빈 utterance(volume=0) speak → 이후 `speak()` 발화 허용
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

  const u = new SpeechSynthesisUtterance(' ')
  u.volume = 0
  speechSynthesis.speak(u)
}

/** TTS 1회 발화 후 onend/onerror 까지 대기. 이전 발화 cancel 시도 즉시 resolve. */
export function speakAsync(text: string, opts: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    const ssu = new SpeechSynthesisUtterance(text)
    ssu.lang = 'ko-KR'
    /** 발화 속도 — 1.0 = 보통. 범위 0.1 ~ 10. default: 1
     *  매장 시끄러우면 0.9 정도로 천천히 발화 권장. UI 슬라이더로 조절. */
    ssu.rate = opts.rate ?? 1.0
    /** 음높이 — 1.0 = 보통. 범위 0 ~ 2. default: 1
     *  값↑ = 여성/높은 톤, 값↓ = 남성/낮은 톤 느낌. */
    ssu.pitch = opts.pitch ?? 1.0
    /** 볼륨 — 0 ~ 1. default: 1 (시스템 볼륨에 곱해짐) */
    ssu.volume = opts.volume ?? 1.0
    ssu.voice = opts.voice ?? null
    ssu.onend = () => resolve()
    ssu.onerror = () => resolve()
    speechSynthesis.speak(ssu)
  })
}
