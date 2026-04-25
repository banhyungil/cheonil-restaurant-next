import { createDummyOrders } from '@/data/dummy/orders'

import type { OrderExt, OrderStatus } from '@/types/order'

/**
 * 더미 주문 상태 (in-memory).
 * 백엔드 구현 전까지 API 호출 시 이 배열을 읽고 쓴다.
 */
const _orders: OrderExt[] = createDummyOrders()

/** 주문 목록 조회 (매장/메뉴 join aggregate). */
export async function fetchList(): Promise<OrderExt[]> {
  return Promise.resolve(_orders)
}

/** 주문 단건 조회. */
export async function fetchById(seq: number): Promise<OrderExt | null> {
  return Promise.resolve(_orders.find((o) => o.seq === seq) ?? null)
}

/** 주문 상태 변경. COOKED로 전이 시 cookedAt 자동 기록, READY 복귀 시 해제. */
export async function updateStatus(seq: number, status: OrderStatus): Promise<void> {
  const order = _orders.find((o) => o.seq === seq)
  if (!order) return
  order.status = status
  if (status === 'COOKED') order.cookedAt = new Date().toISOString()
  else if (status === 'READY') order.cookedAt = null
}

// 2차 구현 예정
// export async function create(payload: Omit<Order, 'seq' | 'regAt' | 'modAt'>): Promise<OrderDetail>
// export async function update(seq: number, payload: Partial<Order>): Promise<OrderDetail>
// export async function remove(seq: number): Promise<void>
