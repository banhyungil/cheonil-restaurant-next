<!-- 도넛 차트 — 결제유형 비율 / 카테고리별 매출 등. 가운데 총합 라벨. -->
<template>
  <div
    class="donut-part-chart flex flex-col gap-2 rounded-lg border border-surface-200 bg-surface-0 p-4"
  >
    <h3 class="text-sm font-semibold text-surface-900">{{ title }}</h3>
    <apexchart
      v-if="parts.length > 0"
      type="donut"
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

import { baseChartOptions, CHART_COLORS, fmtKRW } from '@/utils/chartOptions'

interface Part {
  label: string
  amount: number
  /** 0~100. backend 계산값을 그대로 사용. */
  percent?: number
  /** override color — payType 등 의미별 매핑 시. */
  color?: string
}

const props = defineProps<{
  title: string
  parts: readonly Part[]
}>()

const cTotal = computed(() => props.parts.reduce((s, p) => s + p.amount, 0))

const cSeries = computed(() => props.parts.map((p) => p.amount))

const cOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions,
  chart: { ...baseChartOptions.chart, type: 'donut' },
  labels: props.parts.map((p) => p.label),
  colors: props.parts.map((p, i) => p.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]!),
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: true,
          name: { show: false },
          total: {
            show: true,
            label: '총합',
            color: CHART_COLORS.surfaceText,
            fontSize: '13px',
            formatter: () => fmtKRW(cTotal.value),
          },
          value: {
            show: true,
            color: CHART_COLORS.surfaceText,
            fontSize: '16px',
            fontWeight: 700,
            formatter: (v: string) => fmtKRW(Number(v)),
          },
        },
      },
    },
  },
  legend: {
    position: 'right',
    fontSize: '12px',
    labels: { colors: CHART_COLORS.surfaceText },
    formatter: (label, opts) => {
      if (!opts) return label
      const part = props.parts[opts.seriesIndex]
      if (!part) return label
      const pct = part.percent ?? (cTotal.value > 0 ? (part.amount / cTotal.value) * 100 : 0)
      return `${label} ${pct.toFixed(1)}%`
    },
  },
  tooltip: {
    ...baseChartOptions.tooltip,
    y: { formatter: (v: number) => fmtKRW(v) },
  },
  stroke: { width: 0 },
}))

const DEFAULT_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.card,
  CHART_COLORS.unpaid,
  CHART_COLORS.amber,
  CHART_COLORS.surfaceMuted,
]
</script>
