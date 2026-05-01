import { useMutation, useQueryClient } from '@tanstack/vue-query'

import * as paymentsApi from '@/apis/paymentsApi'
import type {
  PaymentBatchDeletePayload,
  PaymentCreatePayload,
  PaymentSplitPayload,
} from '@/apis/paymentsApi'

import { QUERY_KEYS } from './queryKeys'

/**
 * 결제 mutation 후 invalidate 대상.
 * - sales (KPI / transactions)
 * - payments
 * - orders (status 변경 → 주문현황/주문 목록 영향)
 */
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: QUERY_KEYS.sales })
  qc.invalidateQueries({ queryKey: QUERY_KEYS.payments })
  qc.invalidateQueries({ queryKey: QUERY_KEYS.orders })
}

/** 단건 결제. */
export function usePaymentCreateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PaymentCreatePayload) => paymentsApi.create(payload),
    onSuccess: () => invalidateAll(qc),
  })
}

/** 다중 일괄 결제 — 수금 탭의 [현금]/[카드] 버튼. */
export function usePaymentBatchCreateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payloads: PaymentCreatePayload[]) => paymentsApi.createBatch(payloads),
    onSuccess: () => invalidateAll(qc),
  })
}

/**
 * 분할 결제 — 단일 주문에 대한 N개 결제 행.
 * 수금 탭에서 단일 row 선택 시만 활성. 다이얼로그에서 splits 입력 받음.
 */
export function usePaymentSplitMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PaymentSplitPayload) => paymentsApi.createSplit(payload),
    onSuccess: () => invalidateAll(qc),
  })
}

/**
 * 결제 일괄 취소 — 주문 기준.
 * 수금 탭의 [결제 취소] / 정산 탭 거래 내역의 단건 취소 모두 동일 사용 (단건은 orderSeqs 길이 1).
 */
export function usePaymentBatchDeleteMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PaymentBatchDeletePayload) => paymentsApi.batchDelete(payload),
    onSuccess: () => invalidateAll(qc),
  })
}
