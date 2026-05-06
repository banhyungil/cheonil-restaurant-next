<!-- 통계 - 메뉴 분석 뷰 — 4 카드 (수량 TOP10 + 판매액 TOP10 + 카테고리 + 시간대별 평균 메뉴) -->
<template>
  <div class="stats-menu-view flex flex-col gap-4">
    <!-- 1행: 수량 TOP 10 + 판매액 TOP 10 -->
    <div class="grid grid-cols-2 gap-4">
      <BarHorizontalRanking
        title="🏷 메뉴 판매 TOP 10"
        suffix="수량 기준"
        :rows="cMenusTop10ByCount"
        unit="count"
      />
      <BarHorizontalRanking
        title="💰 메뉴 판매액 TOP 10"
        suffix="매출 기준"
        :rows="cMenusTop10ByAmount"
        unit="KRW"
      />
    </div>

    <!-- 2행: 카테고리별 매출 + 시간대별 메뉴 판매 stacked -->
    <div class="grid grid-cols-2 gap-4">
      <DonutPartChart title="🍱 카테고리별 매출" :parts="cCategoryParts" />
      <BarHourlyMenuStackChart :data="menu?.hourlyMenuStack" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { StatsMenu } from '@/types/salesStats'
import { CHART_COLORS } from '@/utils/chartOptions'

import BarHorizontalRanking from './charts/BarHorizontalRanking.vue'
import BarHourlyMenuStackChart from './charts/BarHourlyMenuStackChart.vue'
import DonutPartChart from './charts/DonutPartChart.vue'

const props = defineProps<{
  menu: StatsMenu | undefined
}>()

const cMenusTop10ByCount = computed(() =>
  (props.menu?.menusTop10 ?? []).map((m) => ({ label: m.menuNm, amount: m.count })),
)

const cMenusTop10ByAmount = computed(() =>
  (props.menu?.menusTop10ByAmount ?? []).map((m) => ({ label: m.menuNm, amount: m.amount })),
)

const cCategoryParts = computed(() =>
  (props.menu?.categoryParts ?? []).map((c, i) => ({
    label: c.ctgNm,
    amount: c.amount,
    percent: c.percent,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  })),
)

const CATEGORY_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.card,
  CHART_COLORS.amber,
  CHART_COLORS.unpaid,
  CHART_COLORS.surfaceMuted,
]
</script>
