import type { OrderExt } from '@/types/order'

/**
 * 주문 도메인 이벤트 버스.
 *
 * `useOrderStream` (App 루트, SSE 수신) → `useOrderAnnouncer` (페이지 단위, 음성 발화) 간
 * 결합 없이 이벤트 전달. 캐시 갱신과 음성 발화를 분리하여 SRP 유지.
 *
 * 모듈 스코프 싱글턴 — Vue 컴포넌트 lifecycle 무관하게 항상 살아있음.
 * 구독 해제는 `on()` 반환값 호출로 명시적으로 처리해야 함 (메모리 누수 방지).
 */
type Listener<T> = (payload: T) => void

function createBus<T>() {
  const listeners = new Set<Listener<T>>()
  return {
    on(fn: Listener<T>) {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
    emit(payload: T) {
      listeners.forEach((fn) => fn(payload))
    },
  }
}

export const orderCreatedBus = createBus<OrderExt>()
export const orderUpdatedBus = createBus<OrderExt>()
