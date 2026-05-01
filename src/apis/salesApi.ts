import type { PayType } from '@/types/payment'
import type { PageRes, SalesSummary, Transaction } from '@/types/sales'

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
