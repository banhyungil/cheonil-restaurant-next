<template>
  <div
    :class="[
      'order-time-bar flex h-9 items-center gap-2 rounded-lg px-3',
      STATUS_CLASSES[cElapsed.status].timeRowBg,
    ]"
  >
    <Clock :size="14" class="text-surface-500" />
    <span class="text-sm font-medium text-surface-500">{{ cOrderTime }}</span>
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
import { STATUS_CLASSES } from '@/composables/useElapsedTime'
import { format } from 'date-fns'
import { Clock } from 'lucide-vue-next'

const props = defineProps<{
  /** 주문 시각 (ISO string). */
  orderAt: string
}>()

const cElapsed = useElapsedTime(() => props.orderAt)
const cOrderTime = computed(() => format(new Date(props.orderAt), 'hh:mm a'))

const BADGE_BG: Record<ElapsedStatus, string> = {
  fresh: 'bg-blue-500',
  caution: 'bg-status-caution',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
}
</script>

<style scoped></style>
