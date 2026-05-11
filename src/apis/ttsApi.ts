import { api } from './api'

export interface TtsParams {
  text: string
  /** 0.5 ~ 2.0. default 1.0. Google TTS speakingRate 로 매핑. */
  speed?: number
  /** Google TTS volumeGainDb 직접 매핑. 0=보통, 3=크게, 6=매우크게. 캐시 키 일부. */
  gainDb?: number
  /** Google TTS 화자 풀네임 (예: ko-KR-Chirp3-HD-Achernar). 미지정 시 서버 기본값. */
  voice?: string
}

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
}: TtsParams): Promise<Blob> {
  const res = await api.get<Blob>('/tts', {
    params: { text, speed, gainDb, voice },
    responseType: 'blob',
    timeout: 30_000,
    silent: true,
  })
  return res.data
}
