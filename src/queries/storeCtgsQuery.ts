import { useQuery } from '@tanstack/vue-query'

import * as storeCtgsApi from '@/apis/storeCtgsApi'

import { QUERY_KEYS } from './queryKeys'

/** 매장 카테고리 전체 조회 쿼리. */
export function useStoreCtgsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.storeCtgs,
    queryFn: () => storeCtgsApi.fetchList(),
  })
}
