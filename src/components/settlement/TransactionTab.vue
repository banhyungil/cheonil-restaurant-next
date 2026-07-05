<!-- 정산 탭 — 날짜 네비 + KPI 카드 + 거래 내역. 단일 루트(KeepAlive 대상), 날짜/필터/검색 등 탭 로컬 상태 내장. -->
<template>
  <div class="flex min-h-0 flex-1 flex-col gap-5">
    <div class="flex items-center">
      <div class="flex-1" />
      <SettlementDateNav
        :date="date"
        :is-today="cIsToday"
        @update:date="setDate"
        @prev="prev"
        @next="next"
        @today="today"
      />
    </div>

    <SalesSummaryCards :summary="summary" />
    <div class="min-h-0 flex-1 overflow-auto">
      <TransactionTable
        v-model:pay-filter="payFilter"
        v-model:store-keyword="storeKeyword"
        :transactions="transactions ?? []"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { useDateNav } from '@/composables/useDateNav'
import { useSalesSummaryQuery, useTransactionsQuery } from '@/queries/salesQuery'

import SettlementDateNav from './SettlementDateNav.vue'

import type { TxPayFilter } from './TransactionTable.vue'

// 날짜 네비 (정산 탭 전용) — KeepAlive 로 탭 전환 후에도 보존.
const { date, cIsToday, prev, next, today, setDate } = useDateNav()

// 정산 탭 데이터 — 단일 날짜라 from=to=선택일 로 범위 엔드포인트 재사용.
const { data: summary } = useSalesSummaryQuery(date)
const { data: transactions } = useTransactionsQuery(
  computed(() => ({ from: date.value, to: date.value })),
)

// 탭 로컬 UI 상태 — KeepAlive 로 탭 전환 후에도 보존.
const payFilter = ref<TxPayFilter>('ALL')
const storeKeyword = ref('')
</script>
