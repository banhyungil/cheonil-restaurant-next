<!-- 가로 막대 ranking — 점포별 매출 / 점포별 매출 (점포 분석) / 메뉴 등 ranking -->
<template>
  <div
    class="bar-horizontal-ranking flex flex-col gap-2 rounded-lg border border-surface-200 bg-surface-0 p-4"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-surface-900">{{ title }}</h3>
      <span v-if="suffix" class="text-xs text-surface-500">{{ suffix }}</span>
    </div>
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
  amount: number
}

const props = withDefaults(
  defineProps<{
    title: string
    rows: readonly Row[]
    /** 우측 상단 보조 라벨 (예: "매출순"). */
    suffix?: string
    /** y축 단위가 통화/건수 — '원' (default) 또는 '건'. */
    unit?: 'KRW' | 'count'
  }>(),
  { unit: 'KRW' },
)

const cHeight = computed(() => Math.max(160, props.rows.length * 32 + 40))

const cSeries = computed(() => [
  { name: props.unit === 'KRW' ? '매출' : '건수', data: props.rows.map((r) => r.amount) },
])

const cOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions,
  chart: { ...baseChartOptions.chart, type: 'bar' },
  colors: [CHART_COLORS.primary],
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
      barHeight: '60%',
      dataLabels: { position: 'right' },
    },
  },
  dataLabels: {
    enabled: true,
    offsetX: 8,
    style: { fontSize: '11px', colors: [CHART_COLORS.surfaceText] },
    formatter: (v: number) => (props.unit === 'KRW' ? fmtKRW(v) : `${v.toLocaleString()}건`),
  },
  xaxis: {
    categories: props.rows.map((r) => r.label),
    labels: { show: false },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: { style: { colors: CHART_COLORS.surfaceText, fontSize: '12px' } },
  },
  grid: { ...baseChartOptions.grid, xaxis: { lines: { show: false } } },
  legend: { show: false },
  tooltip: {
    ...baseChartOptions.tooltip,
    y: {
      formatter: (v: number) => (props.unit === 'KRW' ? fmtKRW(v) : `${v.toLocaleString()}건`),
    },
  },
}))
</script>
