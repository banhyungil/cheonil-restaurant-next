import { useQueryClient } from '@tanstack/vue-query'
import { onBeforeUnmount, onMounted } from 'vue'

import type { OrderStatusChangeResult } from '@/apis/ordersApi'
import { QUERY_KEYS } from '@/queries/queryKeys'
import type { OrderExt } from '@/types/order'

const STREAM_URL = '/api/orders/stream'

/**
 * 주문 도메인 SSE (Server Sent Events) 스트림 구독.
 *
 * App 루트에서 1회 호출 — EventSource 로 연결 + 4종 이벤트를 TanStack Query 캐시에 반영.
 * 캐시 동기화는 SSE 단독 책임 (mutation 의 invalidate 불필요).
 *
 * 이벤트 매핑:
 * - `order:created`        → ordersMonitor 캐시에 append
 * - `order:updated`        → 동일 seq 의 항목 통째로 교체 (전체 aggregate)
 * - `order:status-changed` → 변경 필드만 patch (`seq`, `status`, `cookedAt`, `modAt`)
 * - `order:removed`        → 캐시에서 제거
 *
 * 재연결: EventSource 가 자동 재연결 — `open` 이벤트마다 `invalidateQueries` 로 누락분 회수.
 */
export function useOrderStream() {
  const queryClient = useQueryClient()
  let eventSource: EventSource | null = null

  onMounted(() => {
    eventSource = new EventSource(STREAM_URL)

    eventSource.addEventListener('order:created', (e) => {
      const order = JSON.parse((e as MessageEvent<string>).data) as OrderExt
      queryClient.setQueryData<OrderExt[]>(QUERY_KEYS.ordersMonitor, (old = []) => [...old, order])
    })

    eventSource.addEventListener('order:updated', (e) => {
      const order = JSON.parse((e as MessageEvent<string>).data) as OrderExt
      queryClient.setQueryData<OrderExt[]>(QUERY_KEYS.ordersMonitor, (old) =>
        old?.map((o) => (o.seq === order.seq ? order : o)),
      )
    })

    eventSource.addEventListener('order:status-changed', (e) => {
      const result = JSON.parse((e as MessageEvent<string>).data) as OrderStatusChangeResult
      queryClient.setQueryData<OrderExt[]>(QUERY_KEYS.ordersMonitor, (old) =>
        old?.map((o) => (o.seq === result.seq ? { ...o, ...result } : o)),
      )
    })

    eventSource.addEventListener('order:removed', (e) => {
      const { seq } = JSON.parse((e as MessageEvent<string>).data) as { seq: number }
      queryClient.setQueryData<OrderExt[]>(QUERY_KEYS.ordersMonitor, (old) =>
        old?.filter((o) => o.seq !== seq),
      )
    })

    // 첫 연결 + 재연결 시점 — 누락된 변경분 회수. 활성 쿼리면 dedup 됨.
    eventSource.onopen = () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders })
    }

    // EventSource 는 자동 재연결 — 별도 처리 불필요
    eventSource.onerror = (err) => {
      console.warn('[order-stream] connection error, auto-reconnecting', err)
    }
  })

  onBeforeUnmount(() => {
    eventSource?.close()
    eventSource = null
  })
}
