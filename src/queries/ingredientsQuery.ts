import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import * as ingredientsApi from '@/apis/ingredientsApi'
import type { IngredientSavePayload } from '@/apis/ingredientsApi'

import { QUERY_KEYS } from './queryKeys'

/** 식자재 전체 조회 쿼리. */
export function useIngredientsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.ingredients,
    queryFn: ingredientsApi.fetchList,
  })
}

/** 식자재 생성. */
export function useIngredientCreateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: IngredientSavePayload) => ingredientsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ingredients }),
  })
}

/** 식자재 이름 변경 — 제품 목록의 식자재명도 바뀌므로 함께 갱신. */
export function useIngredientUpdateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ seq, payload }: { seq: number; payload: IngredientSavePayload }) =>
      ingredientsApi.update(seq, payload),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: QUERY_KEYS.ingredients }),
        qc.invalidateQueries({ queryKey: QUERY_KEYS.products }),
      ]),
  })
}

/** 식자재 삭제. */
export function useIngredientRemoveMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (seq: number) => ingredientsApi.remove(seq),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ingredients }),
  })
}
