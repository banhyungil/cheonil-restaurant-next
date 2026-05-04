<!-- 시간대별 매출 bar chart — 피크 시간 색 강조 + 우측 상단 라벨 -->
<template>
  <div
    class="bar-hourly-chart flex flex-col gap-2 rounded-lg border border-surface-200 bg-surface-0 p-4"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-surface-900">📊 시간대별 매출</h3>
      <span v-if="cPeakLabel" class="text-xs text-surface-500">피크 {{ cPeakLabel }}시</span>
    </div>
    <apexchart type="bar" height="240" :options="cOptions" :series="cSeries" />
  </div>
</template>

<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { computed } from 'vue'

import type { HourBucket } from '@/types/salesStats'
import { baseChartOptions, CHART_COLORS, fmtKRW } from '@/utils/chartOptions'

const props = defineProps<{
  hourlys: readonly HourBucket[]
}>()

const cPeakHour = computed<number | null>(() => {
  if (props.hourlys.length === 0) return null
  const peak = props.hourlys.reduce((best, h) => (h.amount > best.amount ? h : best))
  return peak.amount > 0 ? peak.hour : null
})

const cPeakLabel = computed(() =>
  cPeakHour.value == null ? null : String(cPeakHour.value).padStart(2, '0'),
)

const cSeries = computed(() => [
  {
    name: '매출',
    data: props.hourlys.map((h) => h.amount),
  },
])

const cOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions,
  chart: { ...baseChartOptions.chart, type: 'bar' },
  colors: [CHART_COLORS.primaryLight],
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '60%',
      distributed: true, // 각 막대 다른 색 가능 (피크 강조용)
    },
  },
  legend: { show: false },
  xaxis: {
    categories: props.hourlys.map((h) => String(h.hour).padStart(2, '0')),
    labels: { style: { colors: CHART_COLORS.surfaceMuted, fontSize: '11px' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      formatter: (v: number) =>
        v >= 10000 ? `${(v / 10000).toFixed(0)}만` : `${v.toLocaleString()}`,
      style: { colors: CHART_COLORS.surfaceMuted, fontSize: '11px' },
    },
  },
  // 피크 시간만 진한 색
  fill: {
    colors: [
      ({ dataPointIndex }: { dataPointIndex: number }) => {
        const h = props.hourlys[dataPointIndex]
        return h && h.hour === cPeakHour.value ? CHART_COLORS.primary : CHART_COLORS.primaryLight
      },
    ],
  },
  tooltip: {
    ...baseChartOptions.tooltip,
    y: { formatter: (v: number) => fmtKRW(v) },
  },
}))
</script>
