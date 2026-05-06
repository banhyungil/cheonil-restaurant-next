<!-- 시간대×매장 heatmap — multi-select 로 표시 매장 선택 -->
<template>
  <div
    class="store-hour-heatmap-chart flex flex-col gap-3 rounded-lg border border-surface-200 bg-surface-0 p-4"
  >
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-sm font-semibold text-surface-900">⏰ 시간대×매장 주문 heatmap</h3>
      <MultiSelect
        v-model="selStoreSeqs"
        :options="cStoreOptions"
        option-value="val"
        option-label="label"
        placeholder="매장 선택"
        display="chip"
        filter
        filter-placeholder="매장명 검색"
        :reset-filter-on-hide="true"
        class="w-80"
      />
    </div>

    <apexchart
      v-if="cFiltered.length > 0"
      type="heatmap"
      :height="cHeight"
      :options="cOptions"
      :series="cSeries"
    />
    <div v-else class="flex h-32 items-center justify-center text-sm text-surface-500">
      매장을 선택하세요
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { computed, watch } from 'vue'

import type { StoreHourHeatmap } from '@/types/salesStats'
import { baseChartOptions, CHART_COLORS } from '@/utils/chartOptions'

const props = defineProps<{
  rows: readonly StoreHourHeatmap[]
}>()

const cStoreOptions = computed(() => props.rows.map((r) => ({ val: r.storeSeq, label: r.storeNm })))

/** 선택된 매장 — localStorage 영속. 페이지 재진입 시 선택 유지. */
const selStoreSeqs = useLocalStorage<number[]>('sales:storeHourHeatmap:selStoreSeqs', [])

watch(
  () => props.rows,
  (rows) => {
    if (rows.length === 0) {
      return
    }

    const validSeqs = new Set(rows.map((r) => r.storeSeq))
    const filtered = selStoreSeqs.value.filter((seq) => validSeqs.has(seq))
    if (filtered.length === 0) {
      selStoreSeqs.value = rows.map((r) => r.storeSeq)
    } else if (filtered.length !== selStoreSeqs.value.length) {
      selStoreSeqs.value = filtered
    }
  },
  { immediate: true },
)

const cFiltered = computed(() => props.rows.filter((r) => selStoreSeqs.value.includes(r.storeSeq)))

/** 매장 row 마다 32px + header/legend 여유. */
const cHeight = computed(() => Math.max(180, cFiltered.value.length * 36 + 60))

const cSeries = computed(() =>
  cFiltered.value.map((r) => ({
    name: r.storeNm,
    data: r.hourly.map((h) => ({ x: String(h.hour).padStart(2, '0'), y: h.count })),
  })),
)

const cOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions,
  chart: { ...baseChartOptions.chart, type: 'heatmap' },
  // 단일 색상 gradient — primary 톤. 단계는 ApexCharts 가 max 값 기준 자동 분할.
  colors: [CHART_COLORS.primary],
  plotOptions: {
    heatmap: {
      shadeIntensity: 0.5,
      radius: 4,
      useFillColorAsStroke: false,
      colorScale: {
        ranges: [{ from: 0, to: 0, color: CHART_COLORS.surfaceLine, name: '0' }],
      },
    },
  },
  xaxis: {
    type: 'category',
    labels: { style: { colors: CHART_COLORS.surfaceMuted, fontSize: '11px' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: { style: { colors: CHART_COLORS.surfaceText, fontSize: '12px' } },
  },
  dataLabels: {
    enabled: true,
    style: { fontSize: '10px', colors: ['#fff'] },
  },
  legend: { show: false },
  tooltip: {
    ...baseChartOptions.tooltip,
    y: { formatter: (v: number) => `${v}건` },
  },
  stroke: { width: 1, colors: ['#fff'] },
}))
</script>
