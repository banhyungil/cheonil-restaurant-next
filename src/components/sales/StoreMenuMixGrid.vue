<!-- 점포별 메뉴 mix mini donut grid — multi-select + 매장당 자체 TOP 5+기타 도넛 -->
<template>
  <div
    class="store-menu-mix-grid flex flex-col gap-3 rounded-lg border border-surface-200 bg-surface-0 p-4"
  >
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-sm font-semibold text-surface-900">📦 점포별 메뉴 TOP 5</h3>
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
    <div v-if="cFilteredMixes.length > 0" class="grid gap-3" :class="cGridCols">
      <article
        v-for="m in cFilteredMixes"
        :key="m.storeSeq"
        class="flex flex-col gap-2 rounded-md border border-surface-200 bg-surface-50 p-3"
      >
        <h4 class="truncate text-sm font-semibold text-surface-900">{{ m.storeNm }}</h4>
        <apexchart type="donut" height="160" :options="cOptionsFor(m)" :series="cSeriesFor(m)" />
        <ol class="flex flex-col gap-1 text-xs">
          <li v-for="(p, i) in m.parts" :key="p.menuNm" class="flex items-center gap-1.5">
            <span
              class="inline-block size-2 rounded-full"
              :style="{ background: PALETTE[i % PALETTE.length] }"
            />
            <span class="flex-1 truncate text-surface-800">{{ p.menuNm }}</span>
            <span class="font-semibold text-emerald-600">{{ p.count }}</span>
            <span class="w-8 text-right text-surface-500">{{ p.percent.toFixed(0) }}%</span>
          </li>
        </ol>
        <div v-if="m.etcCount > 0" class="text-xs text-surface-500">기타 {{ m.etcCount }}건</div>
      </article>
    </div>
    <div v-else class="flex h-32 items-center justify-center text-sm text-surface-500">
      매장을 선택하세요
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { computed, watch } from 'vue'

import type { StoreMenuMix } from '@/types/salesStats'
import { baseChartOptions, CHART_COLORS } from '@/utils/chartOptions'

const props = defineProps<{
  mixes: readonly StoreMenuMix[]
}>()

/** 선택된 매장 — localStorage 영속. 페이지 재진입 시 선택 유지. */
const selStoreSeqs = useLocalStorage<number[]>('sales:storeMenuMix:selStoreSeqs', [])

/** 색상 팔레트 — TOP 5 + 기타 (마지막) 6개. */
const PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.card,
  CHART_COLORS.amber,
  CHART_COLORS.unpaid,
  CHART_COLORS.primaryLight,
  CHART_COLORS.surfaceMuted, // 기타
]

const cStoreOptions = computed(() =>
  props.mixes.map((m) => ({ val: m.storeSeq, label: m.storeNm })),
)

/**
 * 데이터 변경 시 stale seq 정리 + 첫 진입 default.
 * - localStorage 에 저장된 seq 중 현재 응답에 없는 것 (삭제된 매장) 제거
 * - 모두 사라지면 (또는 첫 진입) 전체 select
 */
watch(
  () => props.mixes,
  (mixes) => {
    if (mixes.length === 0) {
      return
    }

    const validSeqs = new Set(mixes.map((m) => m.storeSeq))
    const filtered = selStoreSeqs.value.filter((seq) => validSeqs.has(seq))
    if (filtered.length === 0) {
      selStoreSeqs.value = mixes.map((m) => m.storeSeq)
    } else if (filtered.length !== selStoreSeqs.value.length) {
      selStoreSeqs.value = filtered
    }
  },
  { immediate: true },
)

const cFilteredMixes = computed(() =>
  props.mixes.filter((m) => selStoreSeqs.value.includes(m.storeSeq)),
)

/** 선택된 매장 수에 따라 grid columns 자동 — 1~2개면 더 크게, 3+ 면 3 columns. */
const cGridCols = computed(() => {
  const n = cFilteredMixes.value.length
  if (n <= 1) return 'grid-cols-1'
  if (n === 2) return 'grid-cols-2'
  return 'grid-cols-3'
})

function cSeriesFor(m: StoreMenuMix): number[] {
  const series = m.parts.map((p) => p.count)
  if (m.etcCount > 0) series.push(m.etcCount)
  return series
}

function cOptionsFor(m: StoreMenuMix): ApexOptions {
  const labels = m.parts.map((p) => p.menuNm)
  if (m.etcCount > 0) labels.push('기타')
  return {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'donut' },
    labels,
    colors: PALETTE.slice(0, labels.length),
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: { show: false },
            total: {
              show: true,
              label: '총',
              color: CHART_COLORS.surfaceText,
              fontSize: '11px',
              formatter: () => `${cSeriesFor(m).reduce((s, v) => s + v, 0)}건`,
            },
            value: {
              show: true,
              color: CHART_COLORS.surfaceText,
              fontSize: '13px',
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
    dataLabels: { enabled: false },
  }
}
</script>
