import { useQuery } from '@tanstack/vue-query'

import * as storesApi from '@/apis/storesApi'

import { QUERY_KEYS } from './queryKeys'

/** 매장 전체 조회 쿼리. */
export function useStoresQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.stores,
    queryFn: () => storesApi.fetchList(),
  })
}
