import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import * as salesApi from '@/apis/salesApi'
import type {
  DateRangeParams,
  OrdersParams,
  StatsStoreParams,
  StatsTrendParams,
  TransactionsParams,
  UnpaidParams,
} from '@/apis/salesApi'

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

/* ────────────────────────────────────────────────────────────────────
 * 주문내역관리 페이지 (/sales) — 그리드 탭
 * ──────────────────────────────────────────────────────────────────── */

/**
 * 그리드 탭 거래 내역 — `enabled` 로 [검색] 버튼 클릭 시만 호출 보호.
 * 페이징/정렬은 PrimeVue DataTable 클라 처리 (전체 row 응답).
 */
export function useOrdersQuery(
  params: MaybeRefOrGetter<OrdersParams>,
  enabled?: MaybeRefOrGetter<boolean>,
) {
  return useQuery({
    queryKey: computed<unknown[]>(() => [...QUERY_KEYS.salesOrders, toValue(params)]),
    queryFn: () => salesApi.fetchOrders(toValue(params)),
    enabled: computed(() => toValue(enabled) ?? true),
  })
}

/** 그리드 탭 KPI 4 카드 — 동일 필터, [검색] 버튼 동시 trigger. */
export function useOrdersSummaryQuery(
  params: MaybeRefOrGetter<OrdersParams>,
  enabled?: MaybeRefOrGetter<boolean>,
) {
  return useQuery({
    queryKey: computed<unknown[]>(() => [...QUERY_KEYS.salesOrdersSummary, toValue(params)]),
    queryFn: () => salesApi.fetchOrdersSummary(toValue(params)),
    enabled: computed(() => toValue(enabled) ?? true),
  })
}

/**
 * 그리드 탭 다중 삭제 — 회계 정정 (cascade 영향).
 * onSuccess 시 sales / payments / orders 모두 invalidate.
 */
export function useOrdersRemoveMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderSeqs: number[]) => salesApi.removeOrders(orderSeqs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sales })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.payments })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orders })
    },
  })
}

/* ────────────────────────────────────────────────────────────────────
 * 주문내역관리 페이지 (/sales) — 통계 탭
 * ──────────────────────────────────────────────────────────────────── */

/** 통계 - 기본 뷰 (granularity 무관). */
export function useStatsBasicQuery(params: MaybeRefOrGetter<DateRangeParams>) {
  return useQuery({
    queryKey: computed<unknown[]>(() => [...QUERY_KEYS.salesStatsBasic, toValue(params)]),
    queryFn: () => salesApi.fetchStatsBasic(toValue(params)),
  })
}

/**
 * 매출 추이 차트 전용 — 차트 로컬 segment (`day|week|month`) 변경 시만 refetch.
 * 다른 통계 카드들은 영향 없음 (granularity 분리 endpoint).
 */
export function useStatsTrendQuery(params: MaybeRefOrGetter<StatsTrendParams>) {
  return useQuery({
    queryKey: computed<unknown[]>(() => [...QUERY_KEYS.salesStatsTrend, toValue(params)]),
    queryFn: () => salesApi.fetchStatsTrend(toValue(params)),
  })
}

/** 통계 - 메뉴 분석 뷰. */
export function useStatsMenuQuery(params: MaybeRefOrGetter<DateRangeParams>) {
  return useQuery({
    queryKey: computed<unknown[]>(() => [...QUERY_KEYS.salesStatsMenu, toValue(params)]),
    queryFn: () => salesApi.fetchStatsMenu(toValue(params)),
  })
}

/** 통계 - 점포 분석 뷰. storeSeq 변경 시 점포별 메뉴 비중 부분 refetch. */
export function useStatsStoreQuery(params: MaybeRefOrGetter<StatsStoreParams>) {
  return useQuery({
    queryKey: computed<unknown[]>(() => [...QUERY_KEYS.salesStatsStore, toValue(params)]),
    queryFn: () => salesApi.fetchStatsStore(toValue(params)),
  })
}
