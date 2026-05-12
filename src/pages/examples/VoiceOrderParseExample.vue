<!--
  음성/텍스트 주문 파싱 검증 페이지.

  두 가지 경로 테스트:
   1. 텍스트 입력 → /api/voice-order — 파싱 정확도만
   2. 음성 녹음 → /api/voice-order/create-order — STT(Whisper→Google fallback) + 파싱 + 주문 생성
      응답의 engine 필드로 어느 STT 가 성공했는지 확인 (= fallback 동작 검증)
-->
<template>
  <section class="voice-order-parse-example flex h-full flex-col gap-5 px-8 py-6">
    <header class="flex h-10 items-center gap-3">
      <h1 class="text-2xl font-bold text-surface-900">음성 주문 파싱 검증</h1>
      <span class="text-base text-surface-500">· claude CLI 기반</span>
    </header>

    <div class="flex flex-1 gap-5 min-h-0">
      <!-- 좌측: 입력 + 매장/메뉴 사전 -->
      <div class="flex w-1/2 flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold text-surface-900">발화 텍스트</label>
          <Textarea
            v-model="userText"
            rows="4"
            placeholder="예: 강남점에 양념치킨 두 개랑 콜라 하나 덜맵게 주세요"
            class="resize-none text-sm"
          />
          <div class="flex items-center gap-2">
            <BButton color="primary" :loading="loading" :disabled="!userText.trim()" @click="onParse">
              파싱 실행
            </BButton>
            <span v-if="elapsed" class="text-xs text-surface-500">{{ elapsed }}ms</span>
          </div>
        </div>

        <!-- 음성 녹음 → 주문 생성 (STT + parse + create, fallback 동작 검증) -->
        <div class="flex flex-col gap-2 rounded border border-blue-200 bg-blue-50/40 p-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-blue-900">음성 → 주문 생성 (fallback 테스트)</span>
            <span v-if="audioElapsed" class="text-xs text-blue-700">{{ audioElapsed }}ms</span>
          </div>
          <p class="text-xs text-blue-700">
            Whisper STT 실패 시 Google STT 로 자동 재시도. 응답의 <code>engine</code> 필드로 확인.
            ※ 실제 주문이 생성됨 — 검증 후 삭제 필요.
          </p>
          <div class="flex items-center gap-2">
            <BButton
              :color="recording ? 'danger' : 'primary'"
              :loading="transcribing || audioLoading"
              :disabled="audioLoading && !recording"
              @click="onMicToggle"
            >
              <Mic v-if="!recording" :size="14" class="mr-1" />
              <Square v-else :size="14" class="mr-1" />
              {{ recording ? '녹음 종료' : '녹음 시작' }}
            </BButton>
            <span v-if="recording" class="text-xs text-red-600 animate-pulse">● 녹음 중...</span>
            <span v-else-if="audioLoading" class="text-xs text-blue-700">서버 처리 중...</span>
          </div>
        </div>

        <!-- STT 변환 비교 — 동일 오디오를 두 엔진에 병렬 호출, 텍스트 나란히 표시 -->
        <div class="flex flex-col gap-2 rounded border border-purple-200 bg-purple-50/40 p-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-purple-900">STT 변환 비교 (Whisper vs Google)</span>
          </div>
          <p class="text-xs text-purple-700">
            같은 녹음을 두 엔진에 병렬 호출하여 텍스트를 비교. 주문 생성 X.
          </p>
          <div class="flex items-center gap-2">
            <BButton
              :color="compareRecording ? 'danger' : 'secondary'"
              :loading="compareLoading"
              :disabled="compareLoading && !compareRecording"
              @click="onCompareMicToggle"
            >
              <Mic v-if="!compareRecording" :size="14" class="mr-1" />
              <Square v-else :size="14" class="mr-1" />
              {{ compareRecording ? '녹음 종료' : '녹음 시작' }}
            </BButton>
            <span v-if="compareRecording" class="text-xs text-red-600 animate-pulse">
              ● 녹음 중...
            </span>
            <span v-else-if="compareLoading" class="text-xs text-purple-700">두 엔진 호출 중...</span>
          </div>
        </div>

        <!-- 빠른 테스트 샘플 -->
        <div class="flex flex-col gap-2">
          <span class="text-xs font-semibold text-surface-700">샘플 발화</span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="s in SAMPLES"
              :key="s"
              type="button"
              class="rounded-md bg-surface-100 px-2 py-1 text-xs text-surface-700 hover:bg-surface-200"
              @click="userText = s"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <!-- 사전 -->
        <div class="flex min-h-0 flex-1 flex-col gap-2">
          <span class="text-xs font-semibold text-surface-700">매장 ({{ stores?.length ?? 0 }})</span>
          <div class="overflow-auto rounded border border-surface-200 p-2 text-xs">
            <div v-for="s in stores" :key="s.seq">
              <span class="text-surface-400">[{{ s.seq }}]</span> {{ s.nm }}
            </div>
          </div>
          <span class="text-xs font-semibold text-surface-700">메뉴 ({{ menus?.length ?? 0 }})</span>
          <div class="overflow-auto rounded border border-surface-200 p-2 text-xs">
            <div v-for="m in menus" :key="m.seq">
              <span class="text-surface-400">[{{ m.seq }}]</span> {{ m.nm }} ({{ m.price.toLocaleString() }}원)
            </div>
          </div>
        </div>
      </div>

      <!-- 우측: 결과 -->
      <div class="flex w-1/2 flex-col gap-4 overflow-auto">
        <div v-if="error" class="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {{ error }}
        </div>

        <!-- STT 변환 비교 결과 (Whisper / Google 나란히) -->
        <div
          v-if="compareResults"
          class="flex flex-col gap-2 rounded border border-purple-200 bg-purple-50/40 p-3 text-sm"
        >
          <div class="text-xs font-semibold uppercase tracking-wide text-purple-700">
            STT 변환 비교
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="r in compareResults"
              :key="r.engine"
              class="flex flex-col gap-1 rounded border border-surface-200 bg-white p-2"
            >
              <div class="flex items-center justify-between">
                <span class="rounded bg-surface-100 px-2 py-0.5 text-xs font-bold text-surface-700">
                  {{ r.engine.toUpperCase() }}
                </span>
                <span class="text-xs text-surface-500">{{ r.elapsed }}ms</span>
              </div>
              <div v-if="r.error" class="text-xs text-red-600">에러: {{ r.error }}</div>
              <div v-else-if="!r.text" class="text-xs italic text-surface-400">(빈 결과)</div>
              <div v-else class="whitespace-pre-wrap wrap-break-word text-sm text-surface-900">
                {{ r.text }}
              </div>
              <button
                v-if="r.text"
                type="button"
                class="mt-1 self-start rounded bg-surface-100 px-2 py-0.5 text-xs text-surface-700 hover:bg-surface-200"
                @click="userText = r.text"
              >
                이 텍스트로 파싱
              </button>
            </div>
          </div>
        </div>

        <!-- 음성 → 주문 생성 결과 (engine 표시) -->
        <div
          v-if="audioResult"
          class="flex flex-col gap-2 rounded border p-3 text-sm"
          :class="
            audioResult.engine === 'GOOGLE'
              ? 'border-amber-300 bg-amber-50'
              : 'border-green-300 bg-green-50'
          "
        >
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold uppercase tracking-wide text-surface-700">
              STT 엔진
            </span>
            <span
              class="rounded px-2 py-0.5 text-xs font-bold"
              :class="
                audioResult.engine === 'GOOGLE'
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-green-200 text-green-900'
              "
            >
              {{ audioResult.engine }}
            </span>
            <span class="text-xs text-surface-500">
              {{
                audioResult.engine === 'GOOGLE'
                  ? '(Whisper 실패 → Google 으로 fallback)'
                  : '(Whisper 1차 성공)'
              }}
            </span>
            <div class="flex-1" />
            <span class="text-xs text-surface-500">주문 #{{ audioResult.order.seq }}</span>
          </div>
          <div>
            <span class="text-surface-500">인식 텍스트:</span>
            <span class="font-medium">{{ audioResult.transcribedText }}</span>
          </div>
          <div>
            <span class="text-surface-500">매장:</span>
            <span class="font-medium">{{ audioResult.order.storeNm }}</span>
          </div>
          <div>
            <span class="text-surface-500">메뉴:</span>
            <span class="font-medium">
              {{ audioResult.order.menus.map((m) => `${m.menuNm} ×${m.cnt}`).join(', ') }}
            </span>
          </div>
          <div v-if="audioResult.confirmation">
            <span class="text-surface-500">확인 멘트:</span> {{ audioResult.confirmation }}
          </div>
        </div>

        <div v-if="result" class="flex flex-col gap-3">
          <div>
            <label class="text-sm font-semibold text-surface-900">파싱 결과</label>
            <div class="mt-2 rounded border border-surface-200 bg-surface-0 p-3 text-sm">
              <div>
                <span class="text-surface-500">매장:</span>
                {{ resolvedStore?.nm ?? '(미지정)' }}
                <span v-if="result.storeSeq" class="text-xs text-surface-400">[seq={{ result.storeSeq }}]</span>
              </div>
              <div class="mt-2">
                <span class="text-surface-500">메뉴:</span>
                <ul class="ml-3 mt-1 list-disc">
                  <li v-for="(it, i) in resolvedItems" :key="i">
                    {{ it.menu?.nm ?? '(seq=' + it.menuSeq + ' 매칭 실패)' }}
                    × {{ it.cnt }}
                  </li>
                  <li v-if="result.menus.length === 0" class="list-none text-surface-400">없음</li>
                </ul>
              </div>
              <div v-if="result.cmt" class="mt-2">
                <span class="text-surface-500">비고:</span> {{ result.cmt }}
              </div>
              <div v-if="result.unmatched && result.unmatched.length > 0" class="mt-2">
                <span class="text-surface-500">매칭 실패:</span>
                <span class="text-amber-700">{{ result.unmatched.join(', ') }}</span>
              </div>
            </div>
          </div>

          <details class="rounded border border-surface-200 bg-surface-50 p-2 text-xs">
            <summary class="cursor-pointer text-surface-600">원본 응답 (claude raw)</summary>
            <pre class="mt-2 whitespace-pre-wrap break-all text-surface-700">{{ result.raw }}</pre>
          </details>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Mic, Square } from 'lucide-vue-next'
import { useToast } from 'primevue/usetoast'

import { getErrorMessage } from '@/apis/api'
import * as speechApi from '@/apis/speechApi'
import {
  createVoiceOrderFromAudio,
  parseVoiceOrder,
  type VoiceOrderCreateRes,
  type VoiceOrderRes,
} from '@/apis/voiceOrderApi'
import { useSpeechRecorder } from '@/composables/useSpeechRecorder'
import { useMenusQuery } from '@/queries/menusQuery'
import { useStoresQuery } from '@/queries/storesQuery'

const SAMPLES = [
  '양념치킨 두 개 콜라 하나',
  '강남점 후라이드 하나 사이다 둘',
  '치킨 둘이랑 콜라 하나 덜맵게',
  '평소 시키던거',
]

const userText = ref('')
const loading = ref(false)
const error = ref('')
const result = ref<VoiceOrderRes>()
const elapsed = ref(0)

// 음성 → 주문 생성 (fallback 검증)
const audioLoading = ref(false)
const audioElapsed = ref(0)
const audioResult = ref<VoiceOrderCreateRes>()

// STT 변환 비교 (Whisper / Google 병렬)
const compareLoading = ref(false)
interface CompareResult {
  engine: 'whisper' | 'google'
  text: string
  elapsed: number
  error?: string
}
const compareResults = ref<CompareResult[]>()

const toast = useToast()
const { recording, transcribing, start, stopBlob, cancel } = useSpeechRecorder()
const compareRec = useSpeechRecorder()
const compareRecording = compareRec.recording

const { data: stores } = useStoresQuery()
const { data: menus } = useMenusQuery()

const resolvedStore = computed(() =>
  result.value?.storeSeq != null
    ? stores.value?.find((s) => s.seq === result.value!.storeSeq)
    : null,
)

const resolvedItems = computed(
  () =>
    result.value?.menus.map((it) => ({
      ...it,
      menu: menus.value?.find((m) => m.seq === it.menuSeq),
    })) ?? [],
)

async function onParse() {
  if (!userText.value.trim()) return
  loading.value = true
  error.value = ''
  result.value = undefined
  const t0 = performance.now()
  try {
    result.value = await parseVoiceOrder(userText.value)
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    elapsed.value = Math.round(performance.now() - t0)
    loading.value = false
  }
}

async function onMicToggle() {
  if (recording.value) {
    // 종료 + 서버 호출
    let blob: Blob
    try {
      blob = await stopBlob()
    } catch (e) {
      toast.add({
        severity: 'error',
        summary: '녹음 종료 실패',
        detail: getErrorMessage(e),
        life: 3000,
      })
      return
    }
    audioLoading.value = true
    error.value = ''
    audioResult.value = undefined
    const t0 = performance.now()
    try {
      const res = await createVoiceOrderFromAudio(blob)
      audioResult.value = res
      toast.add({
        severity: res.engine === 'GOOGLE' ? 'warn' : 'success',
        summary: res.engine === 'GOOGLE' ? 'Google STT fallback 동작' : 'Whisper 성공',
        detail: `"${res.transcribedText}" → 주문 #${res.order.seq}`,
        life: 5000,
      })
    } catch (e) {
      error.value = getErrorMessage(e)
    } finally {
      audioElapsed.value = Math.round(performance.now() - t0)
      audioLoading.value = false
    }
  } else {
    try {
      await start()
    } catch {
      toast.add({
        severity: 'error',
        summary: '마이크 권한 필요',
        detail: '브라우저 마이크 사용 권한을 허용해주세요',
        life: 3000,
      })
    }
  }
}

onBeforeUnmount(cancel)
onBeforeUnmount(compareRec.cancel)

/** STT 변환 비교 — 동일 오디오로 Whisper / Google 병렬 호출. 결과 텍스트 나란히 표시. */
async function onCompareMicToggle() {
  if (compareRec.recording.value) {
    let blob: Blob
    try {
      blob = await compareRec.stopBlob()
    } catch (e) {
      toast.add({
        severity: 'error',
        summary: '녹음 종료 실패',
        detail: getErrorMessage(e),
        life: 3000,
      })
      return
    }
    compareLoading.value = true
    compareResults.value = undefined
    const run = async (engine: 'whisper' | 'google'): Promise<CompareResult> => {
      const t0 = performance.now()
      try {
        const res = await speechApi.transcribe(blob, { engine })
        return { engine, text: res.text, elapsed: Math.round(performance.now() - t0) }
      } catch (e) {
        return {
          engine,
          text: '',
          elapsed: Math.round(performance.now() - t0),
          error: getErrorMessage(e),
        }
      }
    }
    compareResults.value = await Promise.all([run('whisper'), run('google')])
    compareLoading.value = false
  } else {
    try {
      await compareRec.start()
    } catch {
      toast.add({
        severity: 'error',
        summary: '마이크 권한 필요',
        detail: '브라우저 마이크 사용 권한을 허용해주세요',
        life: 3000,
      })
    }
  }
}
</script>
