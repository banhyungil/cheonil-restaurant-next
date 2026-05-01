<!-- 매출 추이 bar chart — 카드 로컬 [일|주|월] segment + 비교 series -->
<template>
  <div class="bar-trend-chart flex flex-col gap-2 rounded-lg border border-surface-200 bg-surface-0 p-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-surface-900">📈 매출 추이</h3>
      <BTabs
        :model-value="granularity"
        :options="GRAN_OPTIONS"
        variant="segmented"
        size="sm"
        @update:model-value="emit('update:granularity', $event as StatsGranularity)"
      />
    </div>
    <Apexchart
      v-if="data"
      type="bar"
      height="240"
      :options="cOptions"
      :series="cSeries"
    />
    <div v-else class="flex h-60 items-center justify-center text-sm text-surface-500">
      데이터를 불러오는 중...
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { computed } from 'vue'

import type { StatsGranularity, StatsTrend } from '@/types/salesStats'
import { baseChartOptions, CHART_COLORS, fmtKRW } from '@/utils/chartOptions'

const GRAN_OPTIONS: { val: StatsGranularity; label: string }[] = [
  { val: 'day', label: '일' },
  { val: 'week', label: '주' },
  { val: 'month', label: '월' },
]

const props = defineProps<{
  granularity: StatsGranularity
  data: StatsTrend | undefined
}>()

const emit = defineEmits<{
  'update:granularity': [v: StatsGranularity]
}>()

const cSeries = computed(() => {
  const d = props.data
  if (!d) return []
  return [
    { name: '이번 기간', data: d.trend.map((p) => p.amount) },
    { name: '지난 기간', data: d.trendPrev.map((p) => p.amount) },
  ]
})

const cOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions,
  chart: { ...baseChartOptions.chart, type: 'bar' },
  colors: [CHART_COLORS.primary, CHART_COLORS.surfaceLine],
  plotOptions: {
    bar: { borderRadius: 4, columnWidth: '60%' },
  },
  xaxis: {
    categories: props.data?.trend.map((p) => p.label) ?? [],
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
  legend: { position: 'top', horizontalAlign: 'right' },
  tooltip: {
    ...baseChartOptions.tooltip,
    y: { formatter: (v: number) => fmtKRW(v) },
  },
}))
</script>
