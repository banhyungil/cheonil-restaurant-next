import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import * as menusApi from '@/apis/menusApi'
import type { MenuCreatePayload, MenuUpdatePayload } from '@/apis/menusApi'

import { QUERY_KEYS } from './queryKeys'

/**
 * 메뉴 전체 조회 쿼리.
 * @param includeInactive  비활성 메뉴 포함 여부 (관리 페이지 = true). 기본 false.
 */
export function useMenusQuery(includeInactive?: MaybeRefOrGetter<boolean>) {
  return useQuery({
    queryKey: computed<unknown[]>(() => [...QUERY_KEYS.menus, toValue(includeInactive) ?? false]),
    queryFn: () => menusApi.fetchList({ includeInactive: toValue(includeInactive) ?? false }),
  })
}

/** 메뉴 단건 조회 — 편집 페이지 hydrate 보조 (목록 데이터로 충분하면 호출 불필요). */
export function useMenuQuery(seq: MaybeRefOrGetter<number | null>) {
  return useQuery({
    queryKey: computed<unknown[]>(() => [...QUERY_KEYS.menus, toValue(seq)]),
    queryFn: () => menusApi.fetchById(toValue(seq)!),
    enabled: computed(() => toValue(seq) != null),
  })
}

/**
 * 메뉴 생성 — silent 로 글로벌 토스트 skip. 페이지 onError 에서 status 별 처리 (409 inline 등).
 */
export function useMenuCreateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: MenuCreatePayload) => menusApi.create(payload, { silent: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.menus }),
  })
}

/** 메뉴 전체 수정 (PUT 교체) — silent. */
export function useMenuUpdateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ seq, payload }: { seq: number; payload: MenuUpdatePayload }) =>
      menusApi.update(seq, payload, { silent: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.menus }),
  })
}

/** 메뉴 삭제. */
export function useMenuRemoveMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (seq: number) => menusApi.remove(seq),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.menus }),
  })
}

/** 메뉴 활성 토글 — 관리 페이지의 노출 토글에서 사용. */
export function useMenuActiveMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ seq, active }: { seq: number; active: boolean }) =>
      menusApi.patchActive(seq, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.menus }),
  })
}
