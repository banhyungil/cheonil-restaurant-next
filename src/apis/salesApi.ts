import type { PayType } from '@/types/payment'
import type {
  OrderRow,
  OrdersSummary,
  PageRes,
  SalesSummary,
  Transaction,
} from '@/types/sales'
import type {
  StatsBasic,
  StatsGranularity,
  StatsMenu,
  StatsStore,
  StatsTrend,
} from '@/types/salesStats'

import { api } from './api'

/** KPI 5 카드 조회 — 단일 날짜. */
export interface SalesSummaryParams {
  /** 'YYYY-MM-DD'. */
  date: string
}

/** 정산 탭 거래 내역 조회 — 단일 날짜 + 결제수단 필터 + page. */
export interface TransactionsParams {
  /** 'YYYY-MM-DD'. */
  date: string
  storeSeq?: number
  /** 'CASH' / 'CARD' / 'UNPAID' (= 미수). 미지정 시 전체. */
  payType?: PayType | 'UNPAID'
  /** 0-based page index. */
  page?: number
  size?: number
}

/** 수금 탭 미수 조회 — 날짜 무관 모든 미수 (운영자가 누적 미수 일괄 처리). */
export interface UnpaidParams {
  storeSeq?: number
  page?: number
  size?: number
}

/** 정산 KPI — 그날 매출/전일/순매출/현금/카드/미수. */
export async function fetchSummary(params: SalesSummaryParams): Promise<SalesSummary> {
  return api.get<SalesSummary>('/sales/summary', { params }).then((r) => r.data)
}

/** 정산 탭 — 그날 거래 내역 (lazy pagination). */
export async function fetchTransactions(
  params: TransactionsParams,
): Promise<PageRes<Transaction>> {
  return api
    .get<PageRes<Transaction>>('/sales/transactions', { params })
    .then((r) => r.data)
}

/**
 * 수금 탭 — 모든 미수 (날짜 무관).
 * `/sales/transactions` 와 분리한 이유: 의미 명확 + 정산은 단일 날짜라 시그니처 다름.
 */
export async function fetchUnpaid(params?: UnpaidParams): Promise<PageRes<Transaction>> {
  return api.get<PageRes<Transaction>>('/sales/unpaid', { params }).then((r) => r.data)
}

/* ────────────────────────────────────────────────────────────────────
 * 주문내역관리 페이지 (/sales) — 그리드 탭
 * ──────────────────────────────────────────────────────────────────── */

/**
 * 그리드 탭 거래 내역 조회 — 클라 페이징 (전체 응답).
 * 가드: from~to 가 90일 초과면 호출처에서 차단 (UI 가드).
 */
export interface OrdersParams {
  /** 'YYYY-MM-DD'. */
  from: string
  to: string
  storeSeq?: number
  menuSeq?: number
  payType?: PayType | 'UNPAID'
}

/** 그리드 탭 거래 내역 — 페이징/정렬은 PrimeVue DataTable 의 클라 처리. */
export async function fetchOrders(params: OrdersParams): Promise<OrderRow[]> {
  return api.get<OrderRow[]>('/sales/orders', { params }).then((r) => r.data)
}

/** 그리드 탭 KPI 4 카드. 동일 필터 (period+필터). */
export async function fetchOrdersSummary(params: OrdersParams): Promise<OrdersSummary> {
  return api.get<OrdersSummary>('/sales/orders/summary', { params }).then((r) => r.data)
}

/** 그리드 탭 다중 삭제 — 회계 정정. cascade `t_order_menu` + `t_payment`. */
export async function removeOrders(orderSeqs: number[]): Promise<void> {
  return api
    .delete('/sales/orders', { data: { orderSeqs } })
    .then(() => undefined)
}

/* ────────────────────────────────────────────────────────────────────
 * 주문내역관리 페이지 (/sales) — 통계 탭
 * ──────────────────────────────────────────────────────────────────── */

/** 통계 공통 — 날짜 범위만. */
export interface DateRangeParams {
  /** 'YYYY-MM-DD'. */
  from: string
  to: string
}

/** 매출 추이 차트 전용 — granularity 추가. */
export interface StatsTrendParams extends DateRangeParams {
  granularity: StatsGranularity
}

/** 점포 분석 — 점포별 메뉴 비중 select 변경 시 storeSeq 추가. */
export interface StatsStoreParams extends DateRangeParams {
  storeSeq?: number
}

/** 통계 - 기본 뷰 (시간대/점포 TOP 5/결제유형/메뉴 TOP 5 + 헤더 KPI). */
export async function fetchStatsBasic(params: DateRangeParams): Promise<StatsBasic> {
  return api.get<StatsBasic>('/sales/stats/basic', { params }).then((r) => r.data)
}

/** 매출 추이 — 차트 로컬 segment 변경 시만 호출. */
export async function fetchStatsTrend(params: StatsTrendParams): Promise<StatsTrend> {
  return api.get<StatsTrend>('/sales/stats/trend', { params }).then((r) => r.data)
}

/** 통계 - 메뉴 분석 뷰. */
export async function fetchStatsMenu(params: DateRangeParams): Promise<StatsMenu> {
  return api.get<StatsMenu>('/sales/stats/menu', { params }).then((r) => r.data)
}

/** 통계 - 점포 분석 뷰. storeSeq 미지정 시 첫 매장 기본. */
export async function fetchStatsStore(params: StatsStoreParams): Promise<StatsStore> {
  return api.get<StatsStore>('/sales/stats/store', { params }).then((r) => r.data)
}
