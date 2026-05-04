<!-- 미수 현황 — 점포별 미수 합계 list (red bg 강조) -->
<template>
  <div
    class="unpaid-by-store-card flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-4"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-red-700">⚠ 미수 현황</h3>
      <span class="text-xs text-red-600">총 {{ cTotal.toLocaleString() }}원</span>
    </div>
    <ol v-if="rows.length > 0" class="flex flex-col gap-1.5 text-sm">
      <li v-for="r in rows" :key="r.storeSeq" class="flex items-center gap-2">
        <span class="flex-1 truncate text-surface-900">{{ r.storeNm }}</span>
        <span class="font-semibold text-red-600">{{ r.amount.toLocaleString() }}원</span>
        <span class="w-10 text-right text-xs text-red-500">{{ r.count }}건</span>
      </li>
    </ol>
    <div v-else class="py-4 text-center text-sm text-red-500">미수 없음</div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { computed } from 'vue'

import type { StoreUnpaid } from '@/types/salesStats'

const props = defineProps<{
  rows: readonly StoreUnpaid[]
}>()

const cTotal = computed(() => _.sumBy(props.rows, (r) => r.amount))
</script>
