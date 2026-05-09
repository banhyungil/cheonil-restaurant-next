<!--
  MediaRecorder 최소 녹음 예제.

  웹에서 마이크 음성을 녹음하는 가장 단순한 흐름:
    1. getUserMedia 로 마이크 stream 확보 (사용자 권한 요청)
    2. MediaRecorder 로 stream 을 녹음
    3. dataavailable 이벤트로 청크(chunk) 수집
    4. stop 시 청크들을 Blob 으로 합쳐서 사용 (재생 / 업로드)

  실 프로젝트에선 useSpeechRecorder composable 로 추상화되어 있음.
  여기는 그 내부가 어떻게 동작하는지 이해용 raw 예제.
-->
<template>
  <section class="recording-example flex flex-col gap-4 p-8">
    <h1 class="text-2xl font-bold">MediaRecorder 최소 예제</h1>

    <div class="flex gap-2">
      <button
        v-if="!recording"
        class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        @click="onStart"
      >
        🎙 녹음 시작
      </button>
      <button
        v-else
        class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        @click="onStop"
      >
        ■ 녹음 정지
      </button>
    </div>

    <div v-if="status" class="rounded bg-surface-100 p-3 text-sm">{{ status }}</div>

    <!-- 녹음 결과 재생 -->
    <audio v-if="audioUrl" :src="audioUrl" controls class="w-full" />

    <!-- 결과 메타 정보 -->
    <div v-if="audioBlob" class="rounded bg-surface-50 p-3 text-xs text-surface-600">
      <div>크기: {{ (audioBlob.size / 1024).toFixed(1) }} KB</div>
      <div>타입: {{ audioBlob.type }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// ─── 1. 상태 (UI 표시용) ───────────────────────────────────────────────
const recording = ref(false) // 녹음 중인지 여부
const status = ref('') // 사용자 안내 메시지
const audioBlob = ref<Blob>() // 녹음 완료 후 결과 Blob
const audioUrl = ref('') // <audio> 태그용 object URL

// ─── 2. MediaRecorder 관련 핵심 변수 ──────────────────────────────────
// ref 가 아닌 일반 변수 — DOM/Audio API 객체는 reactive 할 필요 없음.
let stream: MediaStream | null = null // 마이크 입력 스트림
let recorder: MediaRecorder | null = null // 녹음 객체
let chunks: Blob[] = [] // 녹음 중간중간 받은 데이터 청크들

/**
 * 녹음 시작.
 *
 * Step 1. getUserMedia({ audio: true }) → 마이크 권한 요청 + 스트림 획득
 *   - 첫 호출 시 브라우저가 권한 다이얼로그 표시
 *   - 거부되면 throw → try/catch 로 처리 필요
 *   - HTTPS 또는 localhost 에서만 동작 (보안 정책)
 *
 * Step 2. new MediaRecorder(stream) → 녹음 객체 생성
 *   - 두 번째 인자로 mimeType 지정 가능 (예: 'audio/webm;codecs=opus')
 *   - 미지정 시 브라우저 기본 사용 (보통 webm)
 *
 * Step 3. dataavailable 이벤트 등록 → 녹음 중 주기적으로 청크 전달받음
 *   - recorder.start(timeslice) 의 timeslice 마다 fire
 *   - timeslice 미지정이면 stop 직전에만 한 번 fire
 *
 * Step 4. recorder.start() → 녹음 시작
 */
async function onStart() {
  try {
    // 이전 결과 클리어
    audioBlob.value = undefined
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value) // 메모리 누수 방지
    audioUrl.value = ''
    chunks = []

    // 1. 마이크 권한 요청 + 스트림 획득
    status.value = '마이크 권한 요청 중...'
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // 2. 녹음 객체 생성
    recorder = new MediaRecorder(stream)

    // 3. 청크 수집 핸들러
    recorder.addEventListener('dataavailable', (e) => {
      // e.data 는 Blob — 빈 청크는 skip
      if (e.data.size > 0) chunks.push(e.data)
    })

    // 4. 녹음 종료 핸들러 — start 호출 후 stop() 시 fire
    recorder.addEventListener('stop', onRecorderStop, { once: true })

    // 5. 녹음 시작 (timeslice 미지정 → stop 시 한 번에 chunk fire)
    recorder.start()
    recording.value = true
    status.value = '🎙 녹음 중...'
  } catch (e) {
    status.value = `에러: ${(e as Error).message}`
    recording.value = false
  }
}

/**
 * 녹음 정지.
 *
 * recorder.stop() → 잠시 후 'stop' 이벤트 fire → onRecorderStop 실행.
 */
function onStop() {
  if (!recorder || !recording.value) return
  recorder.stop()
  status.value = '녹음 종료 중...'
}

/**
 * 'stop' 이벤트 핸들러 — 청크들을 Blob 으로 합치고 결과 노출.
 *
 * 마이크 stream 도 여기서 명시적으로 종료해야 브라우저 탭 indicator 가 사라짐.
 */
function onRecorderStop() {
  recording.value = false

  // 청크 합쳐서 단일 Blob 생성
  // 첫 청크의 mimeType 을 그대로 쓰는 게 안전 (chrome/safari/firefox 차이)
  const mimeType = recorder?.mimeType ?? 'audio/webm'
  audioBlob.value = new Blob(chunks, { type: mimeType })

  // <audio> 태그용 object URL 생성 (메모리 영역에 임시 URL)
  audioUrl.value = URL.createObjectURL(audioBlob.value)

  status.value = `완료: ${audioBlob.value.size} bytes`

  // 마이크 stream 종료 — 안 하면 탭에 빨간 점 계속 표시됨
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
  recorder = null
  chunks = []
}
</script>
