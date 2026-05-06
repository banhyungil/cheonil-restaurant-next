<!-- 시간대별 메뉴 판매 stacked bar — TOP 5 메뉴 + 기타 누적 -->
<template>
  <div
    class="bar-hourly-menu-stack-chart flex flex-col gap-2 rounded-lg border border-surface-200 bg-surface-0 p-4"
  >
    <h3 class="text-sm font-semibold text-surface-900">📋 시간대별 메뉴 판매</h3>
    <apexchart
      v-if="cHasData"
      type="bar"
      height="240"
      :options="cOptions"
      :series="cSeries"
    />
    <div v-else class="flex h-60 items-center justify-center text-sm text-surface-500">
      데이터가 없습니다
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { computed } from 'vue'

import type { StatsHourMenuStack } from '@/types/salesStats'
import { baseChartOptions, CHART_COLORS } from '@/utils/chartOptions'

const props = defineProps<{
  data: StatsHourMenuStack | undefined
}>()

const cHasData = computed(() => (props.data?.hours.length ?? 0) > 0)

/**
 * series 색상 — TOP 5 메뉴는 distinct 색, 마지막 '기타' 는 회색.
 * data.menus 의 마지막 항목이 '기타' 라는 백엔드 컨벤션에 의존.
 */
const SERIES_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.card,
  CHART_COLORS.amber,
  CHART_COLORS.unpaid,
  CHART_COLORS.primaryLight,
  CHART_COLORS.surfaceMuted, // 기타
]

const cSeries = computed(() => {
  const d = props.data
  if (!d) return []
  return d.menus.map((name, i) => ({
    name,
    data: d.hours.map((h) => h.counts[i] ?? 0),
  }))
})

const cOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions,
  chart: { ...baseChartOptions.chart, type: 'bar', stacked: true },
  colors: SERIES_COLORS.slice(0, props.data?.menus.length ?? 0),
  plotOptions: {
    bar: { borderRadius: 4, columnWidth: '60%' },
  },
  xaxis: {
    categories: (props.data?.hours ?? []).map((h) => String(h.hour).padStart(2, '0')),
    labels: { style: { colors: CHART_COLORS.surfaceMuted, fontSize: '11px' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      formatter: (v: number) => v.toLocaleString(),
      style: { colors: CHART_COLORS.surfaceMuted, fontSize: '11px' },
    },
  },
  legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px' },
  tooltip: {
    ...baseChartOptions.tooltip,
    y: { formatter: (v: number) => `${v.toLocaleString()}건` },
  },
  stroke: { width: 1, colors: ['#fff'] },
}))
</script>
