<!-- 통계 탭 헤더 — 뷰 select + 날짜 범위 + 우측 KPI 칩 (기본 뷰만) -->
<template>
  <header class="sales-stats-header flex flex-wrap items-center gap-3">
    <Select
      :model-value="view"
      :options="VIEW_OPTIONS"
      option-value="val"
      option-label="label"
      class="w-36"
      @update:model-value="emit('update:view', $event as StatsView)"
    />

    <DatePicker
      :model-value="cDateRange"
      selection-mode="range"
      date-format="yy-mm-dd"
      show-icon
      :max-date="cToday"
      placeholder="📅 날짜 범위 선택"
      class="w-72"
      @update:model-value="(v) => (cDateRange = v as (Date | null)[] | null)"
    />

    <div class="flex-1" />

    <!-- 기본 뷰 우측 KPI 칩 — 매출/건수 + 전기 대비 -->
    <div v-if="view === 'basic' && summary" class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <span class="text-sm text-surface-500">매출</span>
        <span class="text-base font-bold text-surface-900">
          {{ fmtKRW(summary.totalSales) }}
        </span>
        <DeltaBadge :curr="summary.totalSales" :prev="summary.prevSales" />
      </div>
      <span class="h-5 w-px bg-surface-200" />
      <div class="flex items-center gap-2">
        <span class="text-sm text-surface-500">건수</span>
        <span class="text-base font-bold text-surface-900">
          {{ summary.totalCount.toLocaleString() }}건
        </span>
        <DeltaBadge :curr="summary.totalCount" :prev="summary.prevCount" suffix="건" :is-currency="false" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { format, parse } from 'date-fns'
import { computed } from 'vue'

import { fmtKRW } from '@/utils/chartOptions'
import type { StatsBasic } from '@/types/salesStats'

import DeltaBadge from './DeltaBadge.vue'

export type StatsView = 'basic' | 'menu' | 'store'

const VIEW_OPTIONS: { val: StatsView; label: string }[] = [
  { val: 'basic', label: '기본 뷰' },
  { val: 'menu', label: '메뉴 분석' },
  { val: 'store', label: '점포 분석' },
]

const props = defineProps<{
  view: StatsView
  /** 'YYYY-MM-DD'. */
  from: string | null
  to: string | null
  /** 기본 뷰 우측 KPI 표시용. */
  summary?: StatsBasic | undefined
}>()

const emit = defineEmits<{
  'update:view': [v: StatsView]
  'update:from': [v: string | null]
  'update:to': [v: string | null]
}>()

const cDateRange = computed<(Date | null)[] | null>({
  get: () => {
    const f = props.from ? parse(props.from, 'yyyy-MM-dd', new Date()) : null
    const t = props.to ? parse(props.to, 'yyyy-MM-dd', new Date()) : null
    if (!f && !t) return null
    return [f, t]
  },
  set: (v) => {
    if (!Array.isArray(v) || v.length === 0) {
      emit('update:from', null)
      emit('update:to', null)
      return
    }
    const [f, t] = v
    emit('update:from', f instanceof Date ? format(f, 'yyyy-MM-dd') : null)
    emit('update:to', t instanceof Date ? format(t, 'yyyy-MM-dd') : null)
  },
})

const cToday = computed(() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})
</script>
