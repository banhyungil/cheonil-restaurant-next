<!-- 정산 KPI 5 카드 — 매출 / 순매출 / 현금 / 카드 / 미수 -->
<template>
  <div class="sales-summary-cards grid grid-cols-5 gap-4">
    <!-- 1. 매출 + 전일 대비 % -->
    <div class="flex flex-col gap-1 rounded-lg border border-surface-200 bg-surface-0 p-4">
      <div class="text-sm font-medium text-surface-500">매출</div>
      <div class="text-2xl font-bold text-surface-900">
        {{ cFmt(summary?.totalSales ?? 0) }}원
      </div>
      <div class="text-xs">
        <span :class="cDeltaColor">전일 대비 {{ cDeltaLabel }}</span>
      </div>
    </div>

    <!-- 2. 순매출 -->
    <div class="flex flex-col gap-1 rounded-lg border border-surface-200 bg-surface-0 p-4">
      <div class="text-sm font-medium text-surface-500">순매출</div>
      <div class="text-2xl font-bold text-surface-900">
        {{ cFmt(summary?.netSales ?? 0) }}원
      </div>
      <div class="text-xs text-surface-500">
        지출 {{ cFmt(summary?.expenseTotal ?? 0) }}원 차감
      </div>
    </div>

    <!-- 3. 현금 -->
    <div class="flex flex-col gap-1 rounded-lg border border-surface-200 bg-surface-0 p-4">
      <div class="flex items-center gap-1 text-sm font-medium text-surface-500">
        <Banknote :size="16" class="text-emerald-500" />
        현금
      </div>
      <div class="text-2xl font-bold text-surface-900">
        {{ cFmt(summary?.cash.amount ?? 0) }}원
      </div>
      <div class="text-xs text-surface-500">{{ summary?.cash.count ?? 0 }}건</div>
    </div>

    <!-- 4. 카드 -->
    <div class="flex flex-col gap-1 rounded-lg border border-surface-200 bg-surface-0 p-4">
      <div class="flex items-center gap-1 text-sm font-medium text-surface-500">
        <CreditCard :size="16" class="text-blue-500" />
        카드
      </div>
      <div class="text-2xl font-bold text-surface-900">
        {{ cFmt(summary?.card.amount ?? 0) }}원
      </div>
      <div class="text-xs text-surface-500">{{ summary?.card.count ?? 0 }}건</div>
    </div>

    <!-- 5. 미수 (강조) -->
    <div class="flex flex-col gap-1 rounded-lg border border-red-500 bg-red-50 p-4">
      <div class="flex items-center gap-1 text-sm font-medium text-red-600">
        <TriangleAlert :size="16" />
        미수
      </div>
      <div class="text-2xl font-bold text-red-600">
        {{ cFmt(summary?.unpaid.amount ?? 0) }}원
      </div>
      <div class="text-xs text-red-600">
        {{ summary?.unpaid.count ?? 0 }}건 결제 필요
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Banknote, CreditCard, TriangleAlert } from 'lucide-vue-next'
import { computed } from 'vue'

import type { SalesSummary } from '@/types/sales'

const props = defineProps<{
  summary: SalesSummary | undefined
}>()

const cFmt = (n: number) => n.toLocaleString()

/** 전일 대비 % — prevSales 0 이면 표시 불가. */
const cDelta = computed<number | null>(() => {
  const s = props.summary
  if (!s || s.prevSales === 0) return null
  return ((s.totalSales - s.prevSales) / s.prevSales) * 100
})

const cDeltaLabel = computed(() => {
  const d = cDelta.value
  if (d == null) return '—'
  const sign = d > 0 ? '+' : ''
  return `${sign}${d.toFixed(1)}%`
})

const cDeltaColor = computed(() => {
  const d = cDelta.value
  if (d == null) return 'text-surface-500'
  if (d > 0) return 'text-emerald-500'
  if (d < 0) return 'text-red-600'
  return 'text-surface-500'
})
</script>
