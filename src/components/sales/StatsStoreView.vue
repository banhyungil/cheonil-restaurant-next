<!-- 통계 - 점포 분석 뷰 — 4 카드 (점포별 매출 + 주문 빈도 / 메뉴 mix grid / 시간×매장 heatmap) -->
<template>
  <div class="stats-store-view flex flex-col gap-4">
    <!-- 1행: 점포별 매출 + 주문 빈도 -->
    <div class="grid grid-cols-2 gap-4">
      <BarHorizontalRanking title="🏪 점포별 매출" suffix="매출순" :rows="cStoreSales" unit="KRW" />
      <RankList title="📊 주문 빈도" :rows="cOrderCounts" />
    </div>

    <!-- 2행: 점포별 메뉴 mix mini donut grid (full width) -->
    <StoreMenuMixGrid :mixes="store?.storeMenuMixes ?? []" />

    <!-- 3행: 시간대×매장 heatmap (full width) -->
    <StoreHourHeatmapChart :rows="store?.storeHourHeatmap ?? []" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { StatsStore } from '@/types/salesStats'

import BarHorizontalRanking from './charts/BarHorizontalRanking.vue'
import RankList from './charts/RankList.vue'
import StoreHourHeatmapChart from './charts/StoreHourHeatmapChart.vue'
import StoreMenuMixGrid from './StoreMenuMixGrid.vue'

const props = defineProps<{
  store: StatsStore | undefined
}>()

const cStoreSales = computed(() =>
  (props.store?.stores ?? []).map((s) => ({ label: s.storeNm, amount: s.amount })),
)

const cOrderCounts = computed(() =>
  (props.store?.orderCounts ?? []).map((c) => ({ label: c.storeNm, value: c.count })),
)
</script>
