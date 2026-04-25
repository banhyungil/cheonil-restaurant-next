import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import * as ordersApi from '@/apis/ordersApi'

import type { OrderStatus } from '@/types/order'

import { QUERY_KEYS } from './queryKeys'

/** 주문 목록 조회 쿼리 (매장/메뉴 join aggregate). */
export function useOrdersQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: () => ordersApi.fetchList(),
  })
}

/** 주문 상태 변경 mutation. 성공 시 주문 목록 invalidate. */
export function useOrderStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ seq, status }: { seq: number; status: OrderStatus }) =>
      ordersApi.updateStatus(seq, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders }),
  })
}
