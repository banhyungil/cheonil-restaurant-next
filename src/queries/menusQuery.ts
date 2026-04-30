import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import * as menusApi from '@/apis/menusApi'

import { QUERY_KEYS } from './queryKeys'

/**
 * 메뉴 전체 조회 쿼리.
 * @param includeInactive  비활성 메뉴 포함 여부 (관리 페이지 = true). 기본 false.
 */
export function useMenusQuery(includeInactive?: MaybeRefOrGetter<boolean>) {
  return useQuery({
    queryKey: computed<unknown[]>(() => [
      ...QUERY_KEYS.menus,
      toValue(includeInactive) ?? false,
    ]),
    queryFn: () =>
      menusApi.fetchList({ includeInactive: toValue(includeInactive) ?? false }),
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
