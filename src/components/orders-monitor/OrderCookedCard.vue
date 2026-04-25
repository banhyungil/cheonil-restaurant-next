<!-- 주문처리 완료 카드 -->
<template>
  <div
    class="order-cooked-card flex flex-col gap-2 rounded-[10px] border border-surface-200 bg-white p-3.5"
  >
    <!-- 헤더: 매장명 + ✓ 완료시각 배지 -->
    <div class="flex h-6 items-center gap-2">
      <span class="text-base font-bold text-surface-900">{{ order.storeNm }}</span>
      <div class="flex-1" />
      <span
        class="flex h-5.5 items-center gap-1 rounded-lg bg-primary-50 px-2 text-xs font-semibold text-primary-600"
      >
        <Check :size="12" />
        {{ cCookedTime }}
      </span>
    </div>

    <!-- 메뉴 축약 -->
    <p class="text-base font-medium text-surface-500">{{ cMenuSummary }}</p>

    <div class="flex-1" />

    <!-- 완료 취소 버튼 -->
    <BButton
      v-if="isAll"
      variant="outlined"
      color="secondary"
      class="h-10! w-full! text-sm!"
      @click="emit('cancel', order.seq)"
    >
      완료 취소
    </BButton>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { Check } from 'lucide-vue-next'
import { computed } from 'vue'

import type { OrderExt } from '@/types/order'

const props = withDefaults(
  defineProps<{
    order: OrderExt
    /** 전체보기 = 취소 버튼 표시 / 주방용 = 읽기전용 */
    mode?: 'all' | 'kitchen'
  }>(),
  { mode: 'all' },
)

const emit = defineEmits<{
  cancel: [seq: number]
}>()

const isAll = computed(() => props.mode === 'all')

const cCookedTime = computed(() =>
  props.order.cookedAt ? format(new Date(props.order.cookedAt), 'hh:mm a') : '',
)

/** "제육 1, 돈까스 1" 형식. */
const cMenuSummary = computed(() => props.order.menus.map((m) => `${m.menuNm} ${m.cnt}`).join(', '))
</script>
