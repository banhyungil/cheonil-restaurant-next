import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import * as expensesApi from '@/apis/expensesApi'
import type { ExpenseSavePayload, ExpensesParams } from '@/apis/expensesApi'

import { QUERY_KEYS } from './queryKeys'

/** 지출 목록 — params 가 null 이면 조회하지 않는다 (기간 미선택). */
export function useExpensesQuery(params: MaybeRefOrGetter<ExpensesParams | null>) {
  return useQuery({
    queryKey: computed(() => [...QUERY_KEYS.expenses, toValue(params)]),
    queryFn: () => expensesApi.fetchList(toValue(params)!),
    enabled: computed(() => toValue(params) != null),
  })
}

/** 카테고리에서 쓴 지출명 — 지출명 추천용. */
export function useExpenseNamesQuery(ctgSeq: MaybeRefOrGetter<number | null>) {
  return useQuery({
    queryKey: computed(() => [...QUERY_KEYS.expenseNames, toValue(ctgSeq)]),
    queryFn: () => expensesApi.fetchNames(toValue(ctgSeq)!),
    enabled: computed(() => toValue(ctgSeq) != null),
  })
}

/**
 * 지출 변경 후 갱신 — 목록 / 지출명 추천 + 정산(일일 지출 합계)도 함께.
 * 실패 시 글로벌 토스트 (같은 일자·매장 중복 등 backend 메시지 노출).
 */
function useInvalidate() {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: QUERY_KEYS.expenses }),
      qc.invalidateQueries({ queryKey: QUERY_KEYS.expenseNames }),
      qc.invalidateQueries({ queryKey: QUERY_KEYS.salesSummary }),
    ])
}

/** 저장 후 무효화 — 구입처 매장이 구매처로 바뀔 수 있어 매장 목록도 갱신. */
function useInvalidateWithStores() {
  const qc = useQueryClient()
  const invalidate = useInvalidate()
  return () => Promise.all([invalidate(), qc.invalidateQueries({ queryKey: QUERY_KEYS.stores })])
}

/** 지출 생성. */
export function useExpenseCreateMutation() {
  const invalidate = useInvalidateWithStores()
  return useMutation({
    mutationFn: (payload: ExpenseSavePayload) => expensesApi.create(payload),
    onSuccess: invalidate,
  })
}

/** 지출 전체 수정 (PUT 교체). */
export function useExpenseUpdateMutation() {
  const invalidate = useInvalidateWithStores()
  return useMutation({
    mutationFn: ({ seq, payload }: { seq: number; payload: ExpenseSavePayload }) =>
      expensesApi.update(seq, payload),
    onSuccess: invalidate,
  })
}

/** 지출 삭제. */
export function useExpenseRemoveMutation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (seq: number) => expensesApi.remove(seq),
    onSuccess: invalidate,
  })
}
