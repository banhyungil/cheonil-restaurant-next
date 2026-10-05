import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import * as productsApi from '@/apis/productsApi'
import type { ProductSavePayload } from '@/apis/productsApi'

import { QUERY_KEYS } from './queryKeys'

/** 제품 전체 조회 쿼리. */
export function useProductsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.products,
    queryFn: productsApi.fetchList,
  })
}

/**
 * 제품 변경 후 갱신 — 식자재가 자동 생성되거나 제품 수가 바뀌므로 식자재 목록도 함께.
 * 실패 시 글로벌 토스트 (중복 등 backend 메시지 노출).
 */
function useInvalidate() {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: QUERY_KEYS.products }),
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ingredients }),
    ])
}

/** 제품 생성. */
export function useProductCreateMutation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (payload: ProductSavePayload) => productsApi.create(payload),
    onSuccess: invalidate,
  })
}

/** 제품 전체 수정 (PUT 교체). */
export function useProductUpdateMutation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ seq, payload }: { seq: number; payload: ProductSavePayload }) =>
      productsApi.update(seq, payload),
    onSuccess: invalidate,
  })
}

/** 제품 삭제. */
export function useProductRemoveMutation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (seq: number) => productsApi.remove(seq),
    onSuccess: invalidate,
  })
}
