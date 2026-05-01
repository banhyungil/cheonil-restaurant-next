<!-- 결제수단 chip — CASH/CARD/미수 매핑. -->
<template>
  <span :class="cClass">
    <component :is="cIcon" :size="12" />
    {{ cLabel }}
  </span>
</template>

<script setup lang="ts">
import { Banknote, CreditCard, TriangleAlert } from 'lucide-vue-next'
import { computed } from 'vue'

import type { PayType } from '@/types/payment'

const props = defineProps<{
  payType: PayType | null
}>()

const cLabel = computed(() => {
  if (props.payType === 'CASH') return '현금'
  if (props.payType === 'CARD') return '카드'
  return '미수'
})

const cIcon = computed(() => {
  if (props.payType === 'CASH') return Banknote
  if (props.payType === 'CARD') return CreditCard
  return TriangleAlert
})

const cClass = computed(() => {
  const base = 'inline-flex items-center gap-1 rounded px-2 py-0.5 text-sm font-medium'
  if (props.payType === 'CASH') return `${base} bg-emerald-50 text-emerald-700`
  if (props.payType === 'CARD') return `${base} bg-blue-50 text-blue-700`
  return `${base} bg-red-50 text-red-600`
})
</script>
