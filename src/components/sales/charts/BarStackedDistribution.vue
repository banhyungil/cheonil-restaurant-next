<!-- 가로 stacked bar — 점포별 결제방식 분포 (현금/카드/미수) -->
<template>
  <div
    class="bar-stacked-distribution flex flex-col gap-2 rounded-lg border border-surface-200 bg-surface-0 p-4"
  >
    <h3 class="text-sm font-semibold text-surface-900">{{ title }}</h3>
    <apexchart
      v-if="rows.length > 0"
      type="bar"
      :height="cHeight"
      :options="cOptions"
      :series="cSeries"
    />
    <div v-else class="flex h-32 items-center justify-center text-sm text-surface-500">
      데이터가 없습니다
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { computed } from 'vue'

import { baseChartOptions, CHART_COLORS, fmtKRW } from '@/utils/chartOptions'

interface Row {
  label: string
  cash: number
  card: number
  unpaid: number
}

const props = defineProps<{
  title: string
  rows: readonly Row[]
}>()

const cHeight = computed(() => Math.max(160, props.rows.length * 36 + 60))

const cSeries = computed(() => [
  { name: '현금', data: props.rows.map((r) => r.cash) },
  { name: '카드', data: props.rows.map((r) => r.card) },
  { name: '미수', data: props.rows.map((r) => r.unpaid) },
])

const cOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions,
  chart: { ...baseChartOptions.chart, type: 'bar', stacked: true, stackType: '100%' },
  colors: [CHART_COLORS.cash, CHART_COLORS.card, CHART_COLORS.unpaid],
  plotOptions: {
    bar: { horizontal: true, borderRadius: 4, barHeight: '60%' },
  },
  xaxis: {
    categories: props.rows.map((r) => r.label),
    labels: {
      formatter: (v: string) => `${v}%`,
      style: { colors: CHART_COLORS.surfaceMuted, fontSize: '11px' },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: { style: { colors: CHART_COLORS.surfaceText, fontSize: '12px' } },
  },
  grid: { ...baseChartOptions.grid, xaxis: { lines: { show: false } } },
  legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px' },
  tooltip: {
    ...baseChartOptions.tooltip,
    y: { formatter: (v: number) => fmtKRW(v) },
  },
  stroke: { width: 1, colors: ['#fff'] },
}))
</script>
