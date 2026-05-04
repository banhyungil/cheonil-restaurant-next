<!-- 통계 - 기본 뷰 — 5 카드 (시간대별, 매출 추이, 점포 TOP 5, 결제유형, 메뉴 TOP 5) -->
<template>
  <div class="stats-basic-view flex flex-col gap-4">
    <!-- 1행: 시간대별 + 매출 추이 (큰 차트) -->
    <div class="grid grid-cols-2 gap-4">
      <BarHourlyChart v-if="basic" :hourlys="basic.hourlys" />
      <BarTrendChart
        :granularity="granularity"
        :data="trend"
        @update:granularity="emit('update:granularity', $event)"
      />
    </div>

    <!-- 2행: 점포 TOP 5 / 결제유형 / 메뉴 TOP 5 -->
    <div class="grid grid-cols-3 gap-4">
      <BarHorizontalRanking title="🏪 점포별 매출" :rows="cStoreRows" unit="KRW" />
      <DonutPartChart title="💳 결제유형 비율" :parts="cPayParts" />
      <RankList title="🍽 메뉴 판매 TOP 5" :rows="cMenuRows" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { StatsBasic, StatsGranularity, StatsTrend } from '@/types/salesStats'
import { CHART_COLORS } from '@/utils/chartOptions'

import BarHorizontalRanking from './charts/BarHorizontalRanking.vue'
import BarHourlyChart from './charts/BarHourlyChart.vue'
import BarTrendChart from './charts/BarTrendChart.vue'
import DonutPartChart from './charts/DonutPartChart.vue'
import RankList from './charts/RankList.vue'

const props = defineProps<{
  basic: StatsBasic | undefined
  trend: StatsTrend | undefined
  granularity: StatsGranularity
}>()

const emit = defineEmits<{
  'update:granularity': [v: StatsGranularity]
}>()

const cStoreRows = computed(() =>
  (props.basic?.storesTop5 ?? []).map((s) => ({ label: s.storeNm, amount: s.amount })),
)

const cPayParts = computed(() => {
  const parts = props.basic?.payParts ?? []
  return parts.map((p) => ({
    label: PAY_LABEL[p.payType],
    amount: p.amount,
    percent: p.percent,
    color: PAY_COLOR[p.payType],
  }))
})

const cMenuRows = computed(() =>
  (props.basic?.menusTop5 ?? []).map((m) => ({ label: m.menuNm, value: m.count })),
)

const PAY_LABEL: Record<'CASH' | 'CARD' | 'UNPAID', string> = {
  CASH: '현금',
  CARD: '카드',
  UNPAID: '미수',
}
const PAY_COLOR: Record<'CASH' | 'CARD' | 'UNPAID', string> = {
  CASH: CHART_COLORS.cash,
  CARD: CHART_COLORS.card,
  UNPAID: CHART_COLORS.unpaid,
}
</script>
