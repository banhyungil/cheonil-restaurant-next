import { ref } from 'vue'

import * as speechApi from '@/apis/speechApi'

/**
 * 마이크 녹음 → 서버 STT 변환 → 텍스트 반환.
 *
 * 사용 흐름:
 *  1. `start()` 호출 → 마이크 권한 요청 + 녹음 시작 (`recording = true`)
 *  2. `stop()` 호출 → 녹음 종료 + 서버 업로드 (`transcribing = true`) → 텍스트 resolve
 *  3. 결과는 `lastText` 에도 반영 — UI 가 직접 watch 가능
 *
 * 주의:
 *  - `getUserMedia` 는 user gesture 필요 (autoplay 정책과 동일). 버튼 클릭 등에서 호출.
 *  - 마이크 권한 거부 시 `start()` 가 reject — try/catch 로 처리.
 *  - 컴포넌트 unmount 시 `cancel()` 권장 (스트림/recorder 정리).
 */
export function useSpeechRecorder() {
  const recording = ref(false)
  const transcribing = ref(false)
  const lastText = ref('')

  let recorder: MediaRecorder | null = null
  let stream: MediaStream | null = null
  let chunks: Blob[] = []

  function cleanupStream() {
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    recorder = null
    chunks = []
  }

  async function start(): Promise<void> {
    if (recording.value) return
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recorder = new MediaRecorder(stream)
    chunks = []
    recorder.addEventListener('dataavailable', (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    })
    recorder.start()
    recording.value = true
  }

  /**
   * 녹음 종료 + STT 요청 → 텍스트 반환.
   * 녹음 중이 아닐 때 호출하면 reject.
   */
  function stop(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!recorder || !recording.value) {
        reject(new Error('not recording'))
        return
      }
      const r = recorder
      const mime = r.mimeType || 'audio/webm'
      r.addEventListener(
        'stop',
        async () => {
          recording.value = false
          const blob = new Blob(chunks, { type: mime })
          cleanupStream()
          try {
            transcribing.value = true
            const res = await speechApi.transcribe(blob)
            lastText.value = res.text
            resolve(res.text)
          } catch (e) {
            reject(e)
          } finally {
            transcribing.value = false
          }
        },
        { once: true },
      )
      r.stop()
    })
  }

  /** 녹음 중단 + 업로드 skip — 컴포넌트 unmount 등 cleanup 용. */
  function cancel() {
    if (recorder && recording.value) {
      try {
        recorder.stop()
      } catch {
        // ignore
      }
    }
    recording.value = false
    transcribing.value = false
    cleanupStream()
  }

  onBeforeUnmount(cancel)

  return { recording, transcribing, lastText, start, stop, cancel }
}
