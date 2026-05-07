<template>
  <div
    :class="[
      'order-time-bar flex h-9 items-center gap-2 rounded-lg px-3',
      STATUS_CLASSES[cElapsed.status].timeRowBg,
    ]"
  >
    <component :is="cIcon" :size="14" class="text-surface-500" />
    <span class="text-sm font-medium" :class="rsvAt ? '' : 'text-surface-500'">{{
      cTimeLabel
    }}</span>
    <div class="flex-1" />
    <span
      :class="[
        'order-elapsed-badge flex h-5 items-center justify-center rounded-full px-2 text-xs font-bold text-white',
        BADGE_BG[cElapsed.status],
      ]"
    >
      {{ cElapsed.label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { CalendarClock, Clock } from 'lucide-vue-next'

import { STATUS_CLASSES } from '@/composables/useElapsedTime'

const props = defineProps<{
  /** 주문 시각 (ISO string). */
  orderAt: string
  /** 예약 주문일 때만 — 있으면 rsvAt 기준으로 표시 (예약 14:30 + 잔여/경과). */
  rsvAt?: string | null
}>()

const cAnchor = computed(() => props.rsvAt ?? props.orderAt)
const cElapsed = useElapsedTime(cAnchor)
const cIcon = computed(() => (props.rsvAt ? CalendarClock : Clock))
const cTimeLabel = computed(() => {
  const prefix = props.rsvAt ? '예약' : '주문'
  return `${prefix} ${format(new Date(cAnchor.value), 'hh:mm a')}`
})

const BADGE_BG: Record<ElapsedStatus, string> = {
  fresh: 'bg-blue-500',
  caution: 'bg-status-caution',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
}
</script>

<style scoped></style>
