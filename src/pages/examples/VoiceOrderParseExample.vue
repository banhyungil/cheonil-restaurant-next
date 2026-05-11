<!--
  음성/텍스트 주문 파싱 검증 페이지.

  Spring 의 /api/voice-order 호출 — claude CLI subprocess 로 자연어 → 주문 구조 변환.
  여기선 텍스트 직접 입력만 (STT 통합 X) — 파싱 정확도만 검증.
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
      <div class="flex w-1/2 flex-col gap-4">
        <div v-if="error" class="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {{ error }}
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

import { getErrorMessage } from '@/apis/api'
import { parseVoiceOrder, type VoiceOrderRes } from '@/apis/voiceOrderApi'
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
</script>
