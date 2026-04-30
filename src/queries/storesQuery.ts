import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import * as storesApi from '@/apis/storesApi'
import type { StoreCreatePayload, StoreUpdatePayload } from '@/apis/storesApi'

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

/** 매장 단건 조회 — 편집 페이지 hydrate 보조. */
export function useStoreQuery(seq: MaybeRefOrGetter<number | null>) {
  return useQuery({
    queryKey: computed<unknown[]>(() => [...QUERY_KEYS.stores, toValue(seq)]),
    queryFn: () => storesApi.fetchById(toValue(seq)!),
    enabled: computed(() => toValue(seq) != null),
  })
}

/**
 * 매장 생성 — silent 로 글로벌 토스트 skip. 페이지 onError 에서 status 별 처리 (409 inline 등).
 */
export function useStoreCreateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: StoreCreatePayload) => storesApi.create(payload, { silent: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.stores }),
  })
}

/** 매장 전체 수정 (PUT 교체) — silent. */
export function useStoreUpdateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ seq, payload }: { seq: number; payload: StoreUpdatePayload }) =>
      storesApi.update(seq, payload, { silent: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.stores }),
  })
}

/** 매장 삭제. */
export function useStoreRemoveMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (seq: number) => storesApi.remove(seq),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.stores }),
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
