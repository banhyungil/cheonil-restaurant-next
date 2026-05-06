<!-- 결제수단 chip — 미수 / 현금 / 카드 / 분할 (분할 시 hover tooltip 으로 breakdown). -->
<template>
  <span v-tooltip="cTooltip" :class="cClass">
    <component :is="cIcon" :size="12" />
    {{ cLabel }}
  </span>
</template>

<script setup lang="ts">
import { vTooltip } from 'floating-vue'
import { Banknote, CreditCard, SplitSquareHorizontal, TriangleAlert } from 'lucide-vue-next'
import { computed } from 'vue'

import type { PaymentEntry } from '@/types/sales'

type Kind = 'UNPAID' | 'CASH' | 'CARD' | 'SPLIT'

const props = defineProps<{
  payments: readonly PaymentEntry[]
}>()

const cKind = computed<Kind>(() => {
  if (props.payments.length === 0) return 'UNPAID'
  if (props.payments.length === 1) return props.payments[0]!.payType
  return 'SPLIT'
})

const cLabel = computed(() => {
  if (cKind.value === 'CASH') return '현금'
  if (cKind.value === 'CARD') return '카드'
  if (cKind.value === 'SPLIT') return '분할'
  return '미수'
})

const cIcon = computed(() => {
  if (cKind.value === 'CASH') return Banknote
  if (cKind.value === 'CARD') return CreditCard
  if (cKind.value === 'SPLIT') return SplitSquareHorizontal
  return TriangleAlert
})

const cClass = computed(() => {
  const base = 'inline-flex items-center gap-1 rounded px-2 py-0.5 text-sm font-medium'
  if (cKind.value === 'CASH') return `${base} bg-emerald-50 text-emerald-700`
  if (cKind.value === 'CARD') return `${base} bg-blue-50 text-blue-700`
  if (cKind.value === 'SPLIT') return `${base} bg-amber-50 text-amber-700`
  return `${base} bg-red-50 text-red-600`
})

const cTooltip = computed(() => {
  if (cKind.value !== 'SPLIT') return undefined
  return props.payments
    .map((p) => `${p.payType === 'CASH' ? '현금' : '카드'} ${p.amount.toLocaleString()}원`)
    .join(' · ')
})
</script>
