<!-- 주문 상태 chip — READY/COOKED 는 미결제 (red), PAID 는 완료 (green). -->
<template>
  <span :class="cClass">
    <component :is="cIcon" :size="12" />
    {{ cLabel }}
  </span>
</template>

<script setup lang="ts">
import { CircleAlert, CircleCheck } from 'lucide-vue-next'
import { computed } from 'vue'

import type { OrderStatus } from '@/types/order'

const props = defineProps<{
  status: OrderStatus
}>()

const cIsPaid = computed(() => props.status === 'PAID')

const cLabel = computed(() => (cIsPaid.value ? '완료' : '미결제'))

const cIcon = computed(() => (cIsPaid.value ? CircleCheck : CircleAlert))

const cClass = computed(() => {
  const base = 'inline-flex items-center gap-1 rounded px-2 py-0.5 text-sm font-medium'
  return cIsPaid.value
    ? `${base} bg-emerald-50 text-emerald-700`
    : `${base} bg-red-50 text-red-600`
})
</script>
