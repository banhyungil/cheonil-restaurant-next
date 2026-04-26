import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { subMinutes } from 'date-fns'

import * as ordersApi from '@/apis/ordersApi'
import type { OrderCreatePayload } from '@/apis/ordersApi'

import type { OrderStatus } from '@/types/order'

import { QUERY_KEYS } from './queryKeys'
/**
 * Mutation의 두 가지 역할
 * 캐시 동기화
 * * 성공 후 invalidate/setQueryData → 화면 반영
 * UX ergonomics
 * * isPending, onSuccess/onError 사이드 이펙트 (로딩 / 토스트 / 라우팅 / 카트 리셋)
 * WS가 도입되면 1번은 WS가 담당, 2번은 여전히 mutation이 적합.
 *
 */

/** 주문현황 모니터의 처리완료 표시 윈도우 (분). */
const COOKED_WINDOW_MINUTES = 60

/** 주문 목록 조회 쿼리 (전체). */
export function useOrdersQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: () => ordersApi.fetchList(),
  })
}

/**
 * 주문현황 모니터 쿼리 — READY 전체 + 최근 1시간 내 COOKED.
 * 정렬: 진행중은 order_at ASC (오래된 게 위로), 완료는 cooked_at DESC (최근 위).
 * 실시간 갱신은 추후 WebSocket으로 invalidate 트리거.
 */
export function useOrdersMonitorQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.ordersMonitor,
    queryFn: async () => {
      const cookedSince = subMinutes(new Date(), COOKED_WINDOW_MINUTES).toISOString()
      const list = await ordersApi.fetchList({
        statuses: ['READY', 'COOKED'],
        cookedSince,
      })
      return list
    },
  })
}

/**
 * 주문 생성 mutation.
 * 캐시 동기화는 WebSocket이 담당 → invalidate 안 함.
 * 사이드 이펙트(카트 리셋, 라우팅, 토스트)는 호출 측 onSuccess에서 처리.
 */
export function useOrderCreateMutation() {
  return useMutation({
    mutationFn: (payload: OrderCreatePayload) => ordersApi.create(payload),
  })
}

/**
 * 주문 상태 변경 mutation. 성공 시 orders prefix 쿼리 모두 invalidate
 * (orders / ordersMonitor 동시 갱신).
 * TODO: WebSocket 도입 시 invalidate 제거.
 */
export function useOrderStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ seq, status }: { seq: number; status: OrderStatus }) =>
      ordersApi.updateStatus(seq, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders }),
  })
}
