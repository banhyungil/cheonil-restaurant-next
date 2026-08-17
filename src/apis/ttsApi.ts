import { api } from './api'

export interface TtsParams {
  text: string
  /** 0.5 ~ 2.0. default 1.0. Google TTS speakingRate 로 매핑. */
  speed?: number
  /** Google TTS volumeGainDb 직접 매핑. 0=보통, 3=크게, 6=매우크게. 캐시 키 일부. */
  gainDb?: number
  /** Google TTS 화자 풀네임 (예: ko-KR-Chirp3-HD-Achernar). 미지정 시 서버 기본값. */
  voice?: string
  /**
   * 브라우저 HTTP 캐시까지 우회. default false.
   *
   * 응답에 `Cache-Control: public, max-age=86400` 이 붙어 있어서, 동일 URL 재요청은
   * 서버에 닿지도 않고 브라우저 캐시에서 반환된다 — 서버 캐시를 지워도 재합성이 일어나지 않는다.
   * TTS 관리 페이지의 "다시 합성" 만 이 옵션을 쓴다.
   */
  bypassCache?: boolean
}

/** 캐시 무효화용 URL 파라미터 seed — 호출마다 증가. 서버는 모르는 파라미터라 무시한다. */
let bustSeq = 0

/**
 * 텍스트 → mp3 Blob (Spring → Google Cloud TTS).
 *
 * 서버 캐시(동일 text+speed+gainDb+voice) 적중 시 즉시 응답. 합성 콜드 미스는 0.5~1초.
 * 인터셉터의 자동 에러 토스트는 silent 로 차단 — 호출부 (announceQueue) 가 silent fail.
 */
export async function synthesize({
  text,
  speed = 1.0,
  gainDb = 0,
  voice,
  bypassCache = false,
}: TtsParams): Promise<Blob> {
  const res = await api.get<Blob>('/tts', {
    // URL 자체를 매번 다르게 만들어야 브라우저 캐시를 확실히 건너뛴다.
    // (no-cache 헤더만으로는 구현체에 따라 재검증 없이 재사용될 여지가 있음)
    params: {
      text,
      speed,
      gainDb,
      voice,
      ...(bypassCache ? { _r: `${Date.now()}-${++bustSeq}` } : {}),
    },
    headers: bypassCache ? { 'Cache-Control': 'no-cache' } : undefined,
    responseType: 'blob',
    timeout: 30_000,
    silent: true,
  })
  return res.data
}

/**
 * 서버 디스크 캐시 1건 — TTS 관리 페이지 목록용.
 *
 * 캐시 파일명은 `SHA-256(text|speed|gainDb|voice)` 라 원문 복원이 불가능해서,
 * 서버가 합성 시점에 sidecar 로 남긴 메타데이터를 그대로 받는다.
 */
export interface TtsCacheEntry {
  /** SHA-256 hex — 삭제 API 의 path 파라미터. */
  key: string
  text: string
  speed: number
  gainDb: number
  voice: string
  sizeBytes: number
  /** ISO-8601. 최초 합성 시각. */
  createdAt: string
  /** ISO-8601. 마지막 캐시 hit 시각 (mp3 mtime 기준 근사). */
  lastUsedAt: string
}

/** 캐시 목록 — 최근 사용순. 메타데이터가 없는 구 캐시 파일은 제외된다. */
export async function fetchCacheList(): Promise<TtsCacheEntry[]> {
  return api.get<TtsCacheEntry[]>('/tts/cache').then((r) => r.data)
}

/** 단건 삭제 — 다음 발화 시 현재 파라미터로 재합성된다. */
export async function deleteCacheEntry(key: string): Promise<void> {
  await api.delete(`/tts/cache/${key}`)
}

/** 다중 삭제 — 관리 화면에서 체크한 항목들. 일부가 이미 없어도 나머지는 지워진다. */
export async function deleteCacheEntries(keys: string[]): Promise<void> {
  await api.delete('/tts/cache', { data: { keys } })
}
