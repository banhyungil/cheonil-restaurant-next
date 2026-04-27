import { useMutation, useQuery } from '@tanstack/vue-query'
import { subMinutes } from 'date-fns'

import * as ordersApi from '@/apis/ordersApi'
import type { OrderCreatePayload, OrderUpdatePayload } from '@/apis/ordersApi'

import type { OrderStatus } from '@/types/order'

import { QUERY_KEYS } from './queryKeys'

/**
 * Mutation의 두 가지 역할
 * - 캐시 동기화: SSE 가 단독 담당 (useOrderStream)
 * - UX ergonomics: isPending, onSuccess/onError 사이드 이펙트 (로딩/토스트/라우팅/카트 리셋) — mutation 책임
 *
 * → 모든 mutation은 invalidate/setQueryData 없이 mutationFn만 정의.
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
 * 정렬: 진행중은 order_at ASC (오래된 게 위로), 완료는 cooked_at DESC (최근 위) — 페이지 computed에서 처리.
 * 실시간 갱신: SSE (useOrderStream) → setQueryData 로 캐시 패치.
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

/** 주문 생성 mutation. 캐시 동기화는 SSE 담당. */
export function useOrderCreateMutation() {
  return useMutation({
    mutationFn: (payload: OrderCreatePayload) => ordersApi.create(payload),
  })
}

/** 주문 전체 수정 mutation (PUT 교체). 캐시 동기화는 SSE 담당. */
export function useOrderUpdateMutation() {
  return useMutation({
    mutationFn: ({ seq, payload }: { seq: number; payload: OrderUpdatePayload }) =>
      ordersApi.update(seq, payload),
  })
}

/** 주문 삭제 mutation. 캐시 동기화는 SSE 담당. */
export function useOrderRemoveMutation() {
  return useMutation({
    mutationFn: (seq: number) => ordersApi.remove(seq),
  })
}

/** 주문 상태 변경 mutation. 캐시 동기화는 SSE 담당. */
export function useOrderStatusMutation() {
  return useMutation({
    mutationFn: ({ seq, status }: { seq: number; status: OrderStatus }) =>
      ordersApi.updateStatus(seq, status),
  })
}
