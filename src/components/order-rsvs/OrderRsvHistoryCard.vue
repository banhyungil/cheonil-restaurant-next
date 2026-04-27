<!-- 처리 이력 예약 카드 (접수/취소) -->
<template>
  <div class="order-rsv-history-card flex flex-col gap-2 rounded-xl border border-surface-200 p-3">
    <!-- 헤더: 매장명 + 처리시각 + 상태칩(✓ 접수 / ✕ 취소) -->
    <div class="flex items-center gap-2">
      <span class="font-semibold text-surface-700">{{ rsv.storeNm }}</span>
      <span class="text-xs text-surface-500">{{ format(new Date(rsv.modAt), 'HH:mm') }}</span>
      <div class="flex-1" />
      <span
        class="rounded px-2 py-0.5 text-xs"
        :class="
          rsv.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        "
      >
        {{ rsv.status === 'COMPLETED' ? '✓ 접수 (주문 생성)' : '✕ 취소됨' }}
      </span>
    </div>

    <!-- 출처칩 + 메뉴 1줄 요약 -->
    <div class="flex items-center gap-2 text-sm text-surface-600">
      <span class="rounded bg-surface-100 px-2 py-0.5">#{{ rsv.tmplNm ?? '일회성' }}</span>
      <span>{{ rsv.menus.map((m) => `${m.menuNm} ${m.cnt}`).join(', ') }}</span>
    </div>

    <!-- [↺ 복구] — modAt 기준 1시간 초과 시 비활성 -->
    <BButton
      variant="outlined"
      color="secondary"
      class="h-10! w-full! text-sm!"
      :disabled="cIsExpired"
      @click="emit('restore', rsv.seq)"
    >
      {{ cIsExpired ? '— 복구 불가 (1시간 초과)' : '↺ 복구' }}
    </BButton>
  </div>
</template>

<script setup lang="ts">
import { useNow } from '@vueuse/core'
import { differenceInMinutes, format } from 'date-fns'
import { computed } from 'vue'

import type { OrderRsvExt } from '@/types/orderRsv'

/** 처리 이력 복구 가능 윈도우 (분). */
const RESTORE_WINDOW_MINUTES = 60

const props = defineProps<{
  rsv: OrderRsvExt
}>()

const emit = defineEmits<{
  restore: [seq: number]
}>()

const now = useNow({ interval: 60_000 })

const cIsExpired = computed(
  () => differenceInMinutes(now.value, new Date(props.rsv.modAt)) >= RESTORE_WINDOW_MINUTES,
)
</script>
