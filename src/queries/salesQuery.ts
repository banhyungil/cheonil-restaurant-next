import { useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import * as salesApi from '@/apis/salesApi'
import type { TransactionsParams, UnpaidParams } from '@/apis/salesApi'

import { QUERY_KEYS } from './queryKeys'

/** 정산 KPI (매출/전일/순매출/현금/카드/미수) — 단일 날짜. */
export function useSalesSummaryQuery(date: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed<string[]>(() => [...QUERY_KEYS.salesSummary, toValue(date)]),
    queryFn: () => salesApi.fetchSummary({ date: toValue(date) }),
  })
}

/** 정산 탭 거래 내역 (lazy pagination). 단일 날짜 + 결제수단 필터. */
export function useTransactionsQuery(params: MaybeRefOrGetter<TransactionsParams>) {
  return useQuery({
    queryKey: computed<unknown[]>(() => [...QUERY_KEYS.salesTransactions, toValue(params)]),
    queryFn: () => salesApi.fetchTransactions(toValue(params)),
  })
}

/** 수금 탭 미수 — 날짜 무관 모든 미수. */
export function useUnpaidQuery(params?: MaybeRefOrGetter<UnpaidParams>) {
  return useQuery({
    queryKey: computed<unknown[]>(() => [...QUERY_KEYS.salesUnpaid, toValue(params) ?? {}]),
    queryFn: () => salesApi.fetchUnpaid(toValue(params)),
  })
}
