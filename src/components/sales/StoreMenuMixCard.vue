<!-- 점포별 메뉴 비중 — 점포 select + 도넛 + 우측 list (TOP 4 + 기타 합산) -->
<template>
  <div
    class="store-menu-mix-card flex flex-col gap-2 rounded-lg border border-surface-200 bg-surface-0 p-4"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-surface-900">📦 점포별 메뉴 비중</h3>
      <Select
        :model-value="selStoreSeq"
        :options="storeOptions"
        option-value="val"
        option-label="label"
        class="w-32"
        :placeholder="'매장 선택'"
        @update:model-value="emit('update:selStoreSeq', $event as number | null)"
      />
    </div>

    <div v-if="cParts.length > 0" class="flex items-center gap-4">
      <div class="flex-1">
        <apexchart type="donut" height="220" :options="cOptions" :series="cSeries" />
      </div>
      <ol class="flex flex-1 flex-col gap-1.5 text-sm">
        <li v-for="(p, i) in cParts" :key="p.menuNm" class="flex items-center gap-2">
          <span
            class="inline-block size-2.5 rounded-full"
            :style="{ background: cColors[i % cColors.length] }"
          />
          <span class="flex-1 truncate text-surface-900">{{ p.menuNm }}</span>
          <span class="font-semibold text-emerald-600">{{ p.count }}건</span>
          <span class="w-12 text-right text-xs text-surface-500">{{ p.percent.toFixed(0) }}%</span>
        </li>
      </ol>
    </div>
    <div v-else class="flex h-52 items-center justify-center text-sm text-surface-500">
      데이터가 없습니다
    </div>

    <div v-if="cEtcCount > 0" class="text-xs text-surface-500">
      기타: {{ cEtcCount }}건
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { computed } from 'vue'

import type { StoreMenuPart } from '@/types/salesStats'
import { baseChartOptions, CHART_COLORS } from '@/utils/chartOptions'

const props = defineProps<{
  /** 점포 select 옵션. */
  storeOptions: { val: number; label: string }[]
  /** 선택된 점포 seq — null 이면 미선택. */
  selStoreSeq: number | null
  /** 응답의 storeMenuParts — 보통 1개 (선택된 점포). */
  parts: readonly StoreMenuPart[]
}>()

const emit = defineEmits<{
  'update:selStoreSeq': [v: number | null]
}>()

const cActivePart = computed<StoreMenuPart | undefined>(() => props.parts[0])
const cParts = computed(() => cActivePart.value?.parts ?? [])
const cEtcCount = computed(() => cActivePart.value?.etcCount ?? 0)

const cColors = computed(() => [
  CHART_COLORS.primary,
  CHART_COLORS.card,
  CHART_COLORS.amber,
  CHART_COLORS.unpaid,
  CHART_COLORS.surfaceMuted,
])

const cSeries = computed(() => cParts.value.map((p) => p.count))

const cOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions,
  chart: { ...baseChartOptions.chart, type: 'donut' },
  labels: cParts.value.map((p) => p.menuNm),
  colors: cColors.value,
  legend: { show: false },
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: true,
          name: { show: false },
          total: {
            show: true,
            label: '총',
            color: CHART_COLORS.surfaceText,
            fontSize: '12px',
            formatter: () => `${cParts.value.reduce((s, p) => s + p.count, 0)}건`,
          },
          value: {
            show: true,
            color: CHART_COLORS.surfaceText,
            fontSize: '14px',
            fontWeight: 700,
            formatter: (v: string) => `${Number(v)}건`,
          },
        },
      },
    },
  },
  tooltip: {
    ...baseChartOptions.tooltip,
    y: { formatter: (v: number) => `${v}건` },
  },
  stroke: { width: 0 },
}))
</script>
