import { api } from './api'

export interface SpeechRes {
  text: string
}

export type SttEngine = 'whisper' | 'google'

/**
 * 음성 → 텍스트.
 *
 * @param audio 녹음된 audio Blob (webm/wav/mp3 등). MediaRecorder 기본 포맷 OK.
 * @param opts.engine 엔진 선택 — 기본 whisper (self-host), 'google' 명시 시 Google Cloud STT.
 */
export async function transcribe(
  audio: Blob,
  opts: { engine?: SttEngine } = {},
): Promise<SpeechRes> {
  const formData = new FormData()
  formData.append('audio', audio, 'speech.webm')
  return api
    .post<SpeechRes>('/speech', formData, {
      params: opts.engine ? { engine: opts.engine } : undefined,
      // 모델 추론 + 네트워크 — 기본 10초 timeout 부족할 수 있음
      timeout: 60_000,
    })
    .then((r) => r.data)
}
