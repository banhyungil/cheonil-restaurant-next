<!-- 통계 - 점포 분석 뷰 — 5 카드 (점포별 매출/미수/메뉴 mix grid/주문빈도/결제분포) -->
<template>
  <div class="stats-store-view flex flex-col gap-4">
    <!-- 1행: 점포별 매출 + 미수 현황 -->
    <div class="grid grid-cols-2 gap-4">
      <BarHorizontalRanking title="🏪 점포별 매출" suffix="매출순" :rows="cStoreSales" unit="KRW" />
      <UnpaidByStoreCard :rows="store?.unpaidByStore ?? []" />
    </div>

    <!-- 2행: 점포별 메뉴 mix mini donut grid (full width) -->
    <StoreMenuMixGrid :mixes="store?.storeMenuMixes ?? []" />

    <!-- 3행: 주문 빈도 + 결제방식 분포 -->
    <div class="grid grid-cols-2 gap-4">
      <RankList title="📊 주문 빈도" :rows="cOrderCounts" />
      <BarStackedDistribution title="💳 결제방식 분포" :rows="cPayDistribution" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { StatsStore } from '@/types/salesStats'

import BarHorizontalRanking from './charts/BarHorizontalRanking.vue'
import BarStackedDistribution from './charts/BarStackedDistribution.vue'
import RankList from './charts/RankList.vue'
import StoreMenuMixGrid from './StoreMenuMixGrid.vue'
import UnpaidByStoreCard from './UnpaidByStoreCard.vue'

const props = defineProps<{
  store: StatsStore | undefined
}>()

const cStoreSales = computed(() =>
  (props.store?.stores ?? []).map((s) => ({ label: s.storeNm, amount: s.amount })),
)

const cOrderCounts = computed(() =>
  (props.store?.orderCounts ?? []).map((c) => ({ label: c.storeNm, value: c.count })),
)

const cPayDistribution = computed(() =>
  (props.store?.payDistribution ?? []).map((p) => ({
    label: p.storeNm,
    cash: p.cash,
    card: p.card,
    unpaid: p.unpaid,
  })),
)
</script>
