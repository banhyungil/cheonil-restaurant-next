import { api } from './api'

export interface TtsParams {
  text: string
  /** 0.5 ~ 2.0. default 1.0. MeloTTS speed 파라미터. */
  speed?: number
  /** normalize 후 추가 증폭 (dB). 0=보통, 3=크게, 6=매우크게. 캐시 키 일부. */
  gainDb?: number
}

/**
 * 텍스트 → mp3 Blob (Spring → MeloTTS).
 *
 * 서버 캐시(동일 text+speed+gainDb) 적중 시 즉시 응답. 합성 콜드 미스는 1초 안팎.
 * 인터셉터의 자동 에러 토스트는 silent 로 차단 — 호출부 (announceQueue) 가 silent fail.
 */
export async function synthesize({ text, speed = 1.0, gainDb = 0 }: TtsParams): Promise<Blob> {
  const res = await api.get<Blob>('/tts', {
    params: { text, speed, gainDb },
    responseType: 'blob',
    timeout: 30_000,
    silent: true,
  })
  return res.data
}
