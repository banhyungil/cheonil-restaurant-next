<!-- 음성 주문 로그 — 운영자용 -->
<template>
  <section class="voice-order-logs-page flex h-full flex-col gap-5 px-8 py-6">
    <header class="flex h-10 items-center gap-3">
      <h1 class="text-2xl font-bold text-surface-900">{{ route.meta.nav?.label }}</h1>
      <span class="text-base text-surface-500">
        · 최근 음성 주문 시도 — 분쟁 검증 / 인식 정확도 확인
      </span>
      <div class="flex-1" />
      <BButton variant="outlined" :loading="isFetching" size="sm" @click="refetch()">
        <RefreshCw :size="14" class="mr-1" />
        새로고침
      </BButton>
    </header>

    <div
      v-if="error"
      class="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700"
    >
      불러오기 실패: {{ getErrorMessage(error) }}
    </div>

    <div class="flex flex-1 flex-col min-h-0 gap-3">
      <div class="overflow-auto rounded border border-surface-200 bg-white">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-surface-50 text-surface-700">
            <tr class="text-left">
              <th class="px-3 py-2 font-semibold">시각</th>
              <th class="px-3 py-2 font-semibold">엔진</th>
              <th class="px-3 py-2 font-semibold">Whisper 결과</th>
              <th class="px-3 py-2 font-semibold">Google 결과</th>
              <th class="px-3 py-2 font-semibold">주문</th>
              <th class="px-3 py-2 font-semibold">오디오</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in data?.content ?? []"
              :key="row.seq"
              class="border-t border-surface-100 align-top hover:bg-surface-50"
            >
              <td class="whitespace-nowrap px-3 py-2 text-xs text-surface-600">
                {{ formatDateTime(row.createdAt) }}
              </td>
              <td class="px-3 py-2">
                <span
                  class="rounded px-2 py-0.5 text-xs font-bold"
                  :class="engineBadgeClass(row.engineUsed)"
                >
                  {{ row.engineUsed ?? '실패' }}
                </span>
              </td>
              <td class="max-w-xs px-3 py-2 text-surface-900">
                <span :class="emphasisIfFinal(row, 'WHISPER')">
                  {{ row.whisperText || '—' }}
                </span>
              </td>
              <td class="max-w-xs px-3 py-2 text-surface-900">
                <span :class="emphasisIfFinal(row, 'GOOGLE')">
                  {{ row.googleText || '—' }}
                </span>
              </td>
              <td class="whitespace-nowrap px-3 py-2 text-xs text-surface-700">
                <span v-if="row.orderSeq">#{{ row.orderSeq }}</span>
                <span v-else class="text-red-600" v-tooltip="row.errorMessage ?? ''">실패</span>
              </td>
              <td class="px-3 py-2">
                <audio
                  :src="voiceOrderLogAudioUrl(row.seq)"
                  controls
                  preload="none"
                  class="h-8 max-w-64"
                />
              </td>
            </tr>
            <tr v-if="(data?.content?.length ?? 0) === 0 && !isLoading">
              <td colspan="6" class="px-3 py-10 text-center text-sm text-surface-400">
                로그 없음
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="data && data.totalPages > 1" class="flex items-center justify-end gap-2">
        <span class="text-xs text-surface-500">
          {{ data.number * data.size + 1 }} ~
          {{ data.number * data.size + data.content.length }} / 총 {{ data.totalElements }}건
        </span>
        <BButton
          variant="outlined"
          size="sm"
          :disabled="data.first || isFetching"
          @click="page--"
        >
          이전
        </BButton>
        <span class="text-sm text-surface-700">
          {{ data.number + 1 }} / {{ data.totalPages }}
        </span>
        <BButton variant="outlined" size="sm" :disabled="data.last || isFetching" @click="page++">
          다음
        </BButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { format } from 'date-fns'
import { vTooltip } from 'floating-vue'
import { RefreshCw } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { getErrorMessage } from '@/apis/api'
import {
  fetchVoiceOrderLogs,
  voiceOrderLogAudioUrl,
  type VoiceOrderLogRes,
} from '@/apis/voiceOrderLogsApi'

const route = useRoute()

const page = ref(0)
const size = ref(20)

const { data, isLoading, isFetching, error, refetch } = useQuery({
  queryKey: ['voiceOrderLogs', computed(() => page.value), computed(() => size.value)],
  queryFn: () => fetchVoiceOrderLogs({ page: page.value, size: size.value }),
})

function formatDateTime(iso: string): string {
  try {
    return format(new Date(iso), 'MM-dd HH:mm:ss')
  } catch {
    return iso
  }
}

function engineBadgeClass(engine: VoiceOrderLogRes['engineUsed']): string {
  if (engine === 'WHISPER') return 'bg-green-100 text-green-800'
  if (engine === 'GOOGLE') return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-700'
}

/** finalText 와 일치하는 엔진의 텍스트를 굵게 — 어느 엔진이 채택됐는지 시각화. */
function emphasisIfFinal(row: VoiceOrderLogRes, engine: 'WHISPER' | 'GOOGLE'): string {
  return row.engineUsed === engine ? 'font-semibold' : 'text-surface-500'
}
</script>
