<!-- CSS 패턴 케이스 모음 (라우트 전용, 사이드바 메뉴에는 미노출) -->
<template>
  <div class="css-example-page flex h-screen flex-col gap-6 bg-surface-50 px-8 py-6">
    <header class="flex items-center gap-4">
      <h1 class="text-xl font-bold text-surface-900">CSS 패턴 예시</h1>
      <BTabs v-model="selCase" :options="CASES" />
    </header>

    <div class="flex-1 overflow-auto rounded-xl border border-surface-200 bg-surface-0 p-8">
      <ResponsiveGridCase v-if="selCase === CASE_GRID" />
      <AutoFillVsAutoFitCase v-else-if="selCase === CASE_AUTO_FILL_FIT" />
      <GridRowStretchCase v-else-if="selCase === CASE_ROW_STRETCH" />
      <FlexColumnFillCase v-else-if="selCase === CASE_FLEX_FILL" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import AutoFillVsAutoFitCase from './css/AutoFillVsAutoFitCase.vue'
import FlexColumnFillCase from './css/FlexColumnFillCase.vue'
import GridRowStretchCase from './css/GridRowStretchCase.vue'
import ResponsiveGridCase from './css/ResponsiveGridCase.vue'

const CASE_GRID = 1
const CASE_AUTO_FILL_FIT = 2
const CASE_ROW_STRETCH = 3
const CASE_FLEX_FILL = 4

const CASES = [
  { seq: CASE_GRID, nm: '반응형 그리드' },
  { seq: CASE_AUTO_FILL_FIT, nm: 'auto-fill vs auto-fit' },
  { seq: CASE_ROW_STRETCH, nm: 'Grid 행 stretch' },
  { seq: CASE_FLEX_FILL, nm: 'Flex 높이 채우기' },
] as const

const selCase = ref<number>(CASE_GRID)
</script>
