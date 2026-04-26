import { createDummyOrders } from '@/data/dummy/orders'

import type { OrderExt, OrderMenu, OrderStatus } from '@/types/order'

import { api } from './api'

/**
 * 주문 목록 조회 파라미터.
 * 백엔드는 모든 필터를 conditional WHERE 로 처리.
 */
export interface OrdersListParams {
  /** 조회 상태들. 미지정 시 전체. */
  statuses?: OrderStatus[]
  /** COOKED 주문 cookedAt 하한 (ISO). 모니터 윈도우 제한용. */
  cookedSince?: string
  /** 매장 필터. */
  storeSeq?: number
  /** 주문 시각 범위 시작 (ISO). 날짜별 조회용. */
  orderFrom?: string
  /** 주문 시각 범위 종료 (ISO). 날짜별 조회용. */
  orderTo?: string
}

/**
 * 주문 생성 페이로드.
 * t_order(storeSeq/amount/cmt) + t_order_menu[] 정보를 한 번에 전달.
 * status/orderAt/modAt는 백엔드 default(READY/now()/now()) 사용.
 */
export interface OrderCreatePayload {
  storeSeq: number
  cmt?: string
  /** 주문 메뉴 — orderSeq는 생성 후에 부여되므로 제외. */
  menus: Pick<OrderMenu, 'menuSeq' | 'price' | 'cnt'>[]
}

/**
 * 더미 주문 상태 (in-memory).
 * 백엔드 구현 전까지 API 호출 시 이 배열을 읽고 쓴다.
 */
const _orders: OrderExt[] = createDummyOrders()

/** 주문 목록 조회 (매장/메뉴 join aggregate). */
export async function fetchList(params?: OrdersListParams): Promise<OrderExt[]> {
  return api.get('/orders', { params }).then((res) => res.data)
}

/** 주문 단건 조회. */
// export async function fetchById(seq: number): Promise<OrderExt | null> {
//   return Promise.resolve(_orders.find((o) => o.seq === seq) ?? null)
// }

/** 주문 상태 변경. COOKED로 전이 시 cookedAt 자동 기록, READY 복귀 시 해제. */
export async function updateStatus(seq: number, status: OrderStatus): Promise<void> {
  const order = _orders.find((o) => o.seq === seq)
  if (!order) return
  order.status = status
  if (status === 'COOKED') order.cookedAt = new Date().toISOString()
  else if (status === 'READY') order.cookedAt = null
}

/** 주문 생성. 응답으로 매장/메뉴 join된 aggregate 반환. */
export async function create(payload: OrderCreatePayload): Promise<OrderExt> {
  return api.post<OrderExt>('/orders', payload).then((r) => r.data)
}

// 2차 구현 예정
// export async function update(seq: number, payload: Partial<Order>): Promise<OrderExt>
// export async function remove(seq: number): Promise<void>
