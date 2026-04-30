import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import * as storesApi from '@/apis/storesApi'

import { QUERY_KEYS } from './queryKeys'

/**
 * 매장 전체 조회 쿼리.
 * @param includeInactive  비활성 매장 포함 여부 (관리 페이지 = true). 기본 false.
 */
export function useStoresQuery(includeInactive?: MaybeRefOrGetter<boolean>) {
  return useQuery({
    queryKey: computed<unknown[]>(() => [
      ...QUERY_KEYS.stores,
      toValue(includeInactive) ?? false,
    ]),
    queryFn: () =>
      storesApi.fetchList({ includeInactive: toValue(includeInactive) ?? false }),
  })
}

/** 매장 활성 토글 — 관리 페이지의 노출 토글에서 사용. */
export function useStoreActiveMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ seq, active }: { seq: number; active: boolean }) =>
      storesApi.patchActive(seq, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.stores }),
  })
}
