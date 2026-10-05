import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import * as expenseCtgsApi from '@/apis/expenseCtgsApi'
import type { ExpenseCtgSavePayload } from '@/apis/expenseCtgsApi'

import { QUERY_KEYS } from './queryKeys'

/** 지출 카테고리 전체 조회 쿼리 (flat). 트리 변환은 utils/expenseCtgTree. */
export function useExpenseCtgsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.expenseCtgs,
    queryFn: expenseCtgsApi.fetchList,
  })
}

/** 지출 카테고리 생성. 실패 시 글로벌 토스트 (이름 중복 등 backend 메시지 노출). */
export function useExpenseCtgCreateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExpenseCtgSavePayload) => expenseCtgsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.expenseCtgs }),
  })
}

/** 지출 카테고리 전체 수정 (PUT 교체) — 이름 변경 / 이동. */
export function useExpenseCtgUpdateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ seq, payload }: { seq: number; payload: ExpenseCtgSavePayload }) =>
      expenseCtgsApi.update(seq, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.expenseCtgs }),
  })
}

/** 지출 카테고리 삭제. */
export function useExpenseCtgRemoveMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (seq: number) => expenseCtgsApi.remove(seq),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.expenseCtgs }),
  })
}
