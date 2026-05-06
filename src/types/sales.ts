import type { OrderStatus } from './order'
import type { PayType } from './payment'

/** 결제 수단별 합계 / 건수. */
export interface PayMethodSummary {
  amount: number
  count: number
}

/**
 * 정산 KPI 응답 — 정산 탭의 5개 카드 데이터.
 * 단일 날짜 기준. 통계 / 기간 트렌드는 주문내역 페이지 책임.
 *
 * UI 카드:
 *  1. 매출 + 전일 대비 증감% (`prevSales` 기준)
 *  2. 순매출 (= totalSales - expenseTotal)
 *  3. 💵 현금
 *  4. 💳 카드
 *  5. ⚠ 미수 (그날 미수만 — 수금 탭과 다름)
 */
export interface SalesSummary {
  /** 'YYYY-MM-DD'. */
  date: string
  /** 그날 총 매출 (PAID + 미수 모두 포함). */
  totalSales: number
  /** 전일 총 매출 — 증감% 계산용. 데이터 없으면 0. */
  prevSales: number
  /** 순매출 (totalSales - expenseTotal). */
  netSales: number
  /** 그날 지출 합계. */
  expenseTotal: number
  cash: PayMethodSummary
  card: PayMethodSummary
  /** 그날 미수 — 그날 주문 중 결제 안 된 것. (수금 탭의 "전체 미수" 와 다름) */
  unpaid: PayMethodSummary
}

/**
 * 거래 내역 row — 정산 탭 / 수금 탭 모두 사용.
 * t_order + m_store + t_order_menu + m_menu + t_payment join aggregate.
 */
export interface Transaction {
  orderSeq: number
  storeSeq: number
  storeNm: string
  /** "제육 1, 돈까스 1" 형태로 백엔드가 join + 요약. */
  menuSummary: string
  orderAmount: number
  orderAt: string
  cookedAt: string | null
  /** null = 미수. */
  payType: PayType | null
  payAt: string | null
  /** 결제금액 — 미수면 0. */
  payAmount: number
}

/** Spring Page 표준 응답. */
export interface PageRes<T> {
  content: T[]
  totalElements: number
  /** 0-based. */
  number: number
  size: number
}

/**
 * 주문내역관리 그리드 row — `Transaction` + 상태/비고 확장.
 * 정산 페이지의 read-only 거래 내역과 달리 status / cmt (비고) 노출.
 */
export interface OrderRow extends Transaction {
  status: OrderStatus
  /** 비고 (덜맵게/포장 등 — t_order.cmt). */
  cmt: string | null
}

/**
 * 주문내역관리 그리드 KPI 4 카드 응답.
 * - 조회 기간 매출 (totalSales/totalCount)
 * - 평균 일매출 (avgDailySales/avgDailyCount)
 * - 현금 / 카드 (PayMethodSummary)
 *
 * 정산의 SalesSummary 와 다름: 단일 날짜가 아닌 기간 집계 + prevSales/netSales/unpaid 없음.
 */
export interface OrdersSummary {
  totalSales: number
  totalCount: number
  avgDailySales: number
  avgDailyCount: number
  cash: PayMethodSummary
  card: PayMethodSummary
}
