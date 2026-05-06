<!-- 주문내역관리 그리드 KPI 4 카드 — 조회 기간 매출 / 평균 일매출 / 현금 / 카드 -->
<template>
  <div class="sales-grid-summary-cards grid grid-cols-4 gap-4">
    <!-- 1. 조회 기간 매출 (강조 fill) -->
    <div class="flex flex-col gap-1 rounded-lg bg-primary-500 p-4 text-surface-0">
      <div class="text-sm font-medium opacity-90">조회 기간 매출</div>
      <div class="text-2xl font-bold">{{ cFmt(summary?.totalSales ?? 0) }}원</div>
      <div class="text-xs opacity-80">{{ summary?.totalCount ?? 0 }}건</div>
    </div>

    <!-- 2. 평균 일매출 -->
    <div class="flex flex-col gap-1 rounded-lg border border-surface-200 bg-surface-0 p-4">
      <div class="text-sm font-medium text-surface-500">평균 일매출</div>
      <div class="text-2xl font-bold text-surface-900">
        {{ cFmt(summary?.avgDailySales ?? 0) }}원
      </div>
      <div class="text-xs text-surface-500">평균 {{ summary?.avgDailyCount ?? 0 }}건</div>
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
  </div>
</template>

<script setup lang="ts">
import { Banknote, CreditCard } from 'lucide-vue-next'

import type { OrdersSummary } from '@/types/sales'

defineProps<{
  summary: OrdersSummary | undefined
}>()

const cFmt = (n: number) => n.toLocaleString()
</script>
