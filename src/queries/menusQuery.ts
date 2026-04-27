import { useQuery } from '@tanstack/vue-query'

import * as menusApi from '@/apis/menusApi'

import { QUERY_KEYS } from './queryKeys'

/** 메뉴 전체 조회 쿼리. */
export function useMenusQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.menus,
    queryFn: () => menusApi.fetchList(),
  })
}
