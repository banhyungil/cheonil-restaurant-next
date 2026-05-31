<!-- 정산 탭 — KPI 카드 + 거래 내역. 단일 루트(KeepAlive 대상), 필터/검색 등 탭 로컬 상태 내장. -->
<template>
  <div class="flex min-h-0 flex-1 flex-col gap-5">
    <SalesSummaryCards :summary="summary" />
    <div class="min-h-0 flex-1 overflow-auto">
      <TransactionTable
        v-model:pay-filter="payFilter"
        v-model:store-keyword="storeKeyword"
        :transactions="transactions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import type { SalesSummary, Transaction } from '@/types/sales'

import type { TxPayFilter } from './TransactionTable.vue'

defineProps<{
  /** 정산 KPI 5 카드 데이터. */
  summary: SalesSummary | undefined
  /** 거래 내역 — 부모(SettlementPage)가 날짜 기준 조회해 전달 (수금 탭과 공유). */
  transactions: readonly Transaction[]
}>()

// 탭 로컬 UI 상태 — KeepAlive 로 탭 전환 후에도 보존.
const payFilter = ref<TxPayFilter>('ALL')
const storeKeyword = ref('')
</script>
