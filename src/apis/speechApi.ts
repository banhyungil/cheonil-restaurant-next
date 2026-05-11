import { api } from './api'

export interface SpeechRes {
  text: string
}

/**
 * 음성 → 텍스트 (Spring → 자체 호스팅 Whisper).
 *
 * @param audio 녹음된 audio Blob (webm/wav/mp3 등). MediaRecorder 기본 포맷 OK.
 */
export async function transcribe(audio: Blob): Promise<SpeechRes> {
  const formData = new FormData()
  formData.append('audio', audio, 'speech.webm')
  return api
    .post<SpeechRes>('/speech', formData, {
      // 모델 추론 + 네트워크 — 기본 10초 timeout 부족할 수 있음
      timeout: 60_000,
    })
    .then((r) => r.data)
}
