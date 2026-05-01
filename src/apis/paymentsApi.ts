import type { PayType, Payment } from '@/types/payment'

import { api } from './api'

/**
 * 결제 생성 페이로드.
 * 백엔드: t_payment INSERT + t_order.status='PAID'.
 */
export interface PaymentCreatePayload {
  orderSeq: number
  payType: PayType
}

/** 단건 결제. */
export async function create(payload: PaymentCreatePayload): Promise<Payment> {
  return api.post<Payment>('/orders/payments', payload).then((r) => r.data)
}

/**
 * 다중 일괄 결제 — 수금 탭의 [현금]/[카드] 버튼.
 * 선택된 미결제 주문들을 동일 결제수단으로 일괄 처리.
 */
export async function createBatch(payloads: PaymentCreatePayload[]): Promise<Payment[]> {
  return api.post<Payment[]>('/orders/payments/batch', payloads).then((r) => r.data)
}

/** 분할 결제 한 행 — payType + 금액. */
export interface PaymentSplit {
  payType: PayType
  amount: number
}

/**
 * 단일 주문 분할 결제 페이로드.
 * splits 의 amount 합계 === 주문금액 검증은 백엔드 책임 (트랜잭션 내).
 */
export interface PaymentSplitPayload {
  orderSeq: number
  splits: PaymentSplit[]
}

/**
 * 분할 결제 — 단일 주문을 여러 결제수단/금액으로 나눠서 처리.
 * 수금 탭에서 단일 row 선택 시만 활성. 다이얼로그로 splits 입력 받아 호출.
 */
export async function createSplit(payload: PaymentSplitPayload): Promise<Payment[]> {
  return api.post<Payment[]>('/orders/payments/split', payload).then((r) => r.data)
}

/**
 * 결제 일괄 취소 — 주문 기준.
 * 백엔드: 각 orderSeq 의 t_payment 전부 삭제 + t_order.status PAID→COOKED 복귀.
 * 단건도 `orderSeqs: [seq]` 로 동일 호출 (UI 수금 탭의 단건/다건 통합).
 *
 * 분할 결제는 한 주문에 N개 t_payment 가 묶여 있어 — orderSeq 단위 처리가 단순/안전.
 */
export interface PaymentBatchDeletePayload {
  orderSeqs: number[]
}
export async function batchDelete(payload: PaymentBatchDeletePayload): Promise<void> {
  return api.post('/orders/payments/batch-delete', payload).then(() => undefined)
}
