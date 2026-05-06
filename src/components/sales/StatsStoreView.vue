<!-- 통계 - 점포 분석 뷰 — 4 카드 (매출 TOP10 + 건수 TOP10 / 메뉴 mix grid / 시간×매장 heatmap) -->
<template>
  <div class="stats-store-view flex flex-col gap-4">
    <!-- 1행: 매출 TOP 10 + 건수 TOP 10 (StatsMenuView 와 같은 패턴) -->
    <div class="grid grid-cols-2 gap-4">
      <BarHorizontalRanking
        title="🏪 점포별 매출 TOP 10"
        suffix="매출 기준"
        :rows="cStoreSalesTop10"
        unit="KRW"
      />
      <BarHorizontalRanking
        title="📊 점포별 건수 TOP 10"
        suffix="건수 기준"
        :rows="cStoreCountsTop10"
        unit="count"
      />
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
import StoreHourHeatmapChart from './charts/StoreHourHeatmapChart.vue'
import StoreMenuMixGrid from './StoreMenuMixGrid.vue'

const props = defineProps<{
  store: StatsStore | undefined
}>()

/** 매출 TOP 10 — 백엔드 ordered 가정. 안전하게 클라단에서 정렬+slice. */
const cStoreSalesTop10 = computed(() =>
  [...(props.store?.stores ?? [])]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map((s) => ({ label: s.storeNm, amount: s.amount })),
)

/** 건수 TOP 10. */
const cStoreCountsTop10 = computed(() =>
  [...(props.store?.orderCounts ?? [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((c) => ({ label: c.storeNm, amount: c.count })),
)
</script>
