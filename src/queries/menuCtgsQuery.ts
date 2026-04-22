import { useQuery } from '@tanstack/vue-query'

import * as menuCtgsApi from '@/apis/menuCtgsApi'

import { QUERY_KEYS } from './queryKeys'

/** 메뉴 카테고리 전체 조회 쿼리. */
export function useMenuCtgsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.menuCtgs,
    queryFn: () => menuCtgsApi.fetchList(),
  })
}
