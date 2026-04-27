import type { Order, OrderExt, OrderMenu, OrderStatus } from '@/types/order'

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
 * 주문 수정 페이로드 — PUT 전체 교체 방식 (create와 동일 구조).
 * 백엔드는 t_order_menu를 통째로 재구성. 단가는 클라이언트가 보낸 스냅샷 그대로 사용.
 */
export type OrderUpdatePayload = OrderCreatePayload

/**
 * PATCH /orders/{seq}/status 응답 — 변경된 필드만.
 * 전체 aggregate 대신 변경 결과만 받아 payload 최소화.
 * 클라이언트는 캐시 부분 patch 또는 단순 확인용으로 사용.
 */
export type OrderStatusChangeResult = Pick<Order, 'seq' | 'status' | 'cookedAt' | 'modAt'>

/** 주문 목록 조회 (매장/메뉴 join aggregate). */
export async function fetchList(params?: OrdersListParams): Promise<OrderExt[]> {
  return api.get('/orders', { params }).then((res) => res.data)
}

/** 주문 단건 조회. */
// export async function fetchById(seq: number): Promise<OrderExt | null> {
//   return api.get<OrderExt>(`/orders/${seq}`).then((r) => r.data)
// }

/** 주문 상태 전이. cookedAt은 백엔드가 자동 처리. */
export async function updateStatus(
  seq: number,
  status: OrderStatus,
): Promise<OrderStatusChangeResult> {
  return api
    .patch<OrderStatusChangeResult>(`/orders/${seq}/status`, { status })
    .then((r) => r.data)
}

/** 주문 생성. 응답으로 매장/메뉴 join된 aggregate 반환. */
export async function create(payload: OrderCreatePayload): Promise<OrderExt> {
  return api.post<OrderExt>('/orders', payload).then((r) => r.data)
}

/** 주문 전체 수정 (PUT 교체). 응답으로 갱신된 aggregate 반환. */
export async function update(seq: number, payload: OrderUpdatePayload): Promise<OrderExt> {
  return api.put<OrderExt>(`/orders/${seq}`, payload).then((r) => r.data)
}

/** 주문 삭제. */
export async function remove(seq: number): Promise<void> {
  return api.delete(`/orders/${seq}`).then(() => undefined)
}
