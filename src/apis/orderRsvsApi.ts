import type { OrderRsv, OrderRsvExt, OrderRsvMenu, RsvStatus } from '@/types/orderRsv'

import { api } from './api'

// ============================================================================
// 시그니처
// ============================================================================

/** 예약 목록 조회 파라미터. */
export interface RsvsListParams {
  /** 조회 상태들. 미지정 시 전체. */
  statuses?: RsvStatus[]
  /** 당일 / 모두. 메인 페이지 세그먼트 필터. */
  dayMode?: 'TODAY' | 'ALL'
  /** 매장 필터. */
  storeSeq?: number
}

/**
 * 예약 생성 페이로드.
 * t_order_rsv(storeSeq/rsvAt/amount/cmt) + t_order_rsv_menu[] 일괄 전달.
 * status/regAt/modAt 는 백엔드 default 사용.
 */
export interface RsvCreatePayload {
  storeSeq: number
  /** 예약 일시 (ISO). */
  rsvAt: string
  cmt?: string
  /** 예약 메뉴 — rsvSeq 는 생성 후 부여되므로 제외. */
  menus: Pick<OrderRsvMenu, 'menuSeq' | 'price' | 'cnt'>[]
}

/** 예약 전체 수정 페이로드 — PUT 전체 교체. */
export type RsvUpdatePayload = RsvCreatePayload

/**
 * PATCH /order-rsvs/{seq}/status 응답 — 변경된 필드만.
 * 클라이언트는 캐시 부분 patch 또는 invalidate 트리거용.
 */
export type RsvStatusChangeResult = Pick<OrderRsv, 'seq' | 'status' | 'modAt'>

// ============================================================================
// API 함수
// ============================================================================

/** 예약 목록 조회 (매장/템플릿/메뉴 join aggregate). */
export async function fetchList(params?: RsvsListParams): Promise<OrderRsvExt[]> {
  return api.get<OrderRsvExt[]>('/order-rsvs', { params }).then((r) => r.data)
}

/** 예약 상태 전이. RESERVED → COMPLETED 시 백엔드가 t_order 도 함께 INSERT. */
export async function updateStatus(
  seq: number,
  status: RsvStatus,
): Promise<RsvStatusChangeResult> {
  return api
    .patch<RsvStatusChangeResult>(`/order-rsvs/${seq}/status`, { status })
    .then((r) => r.data)
}

/** 예약 생성 (일회성). 응답으로 join 된 aggregate 반환. */
export async function create(payload: RsvCreatePayload): Promise<OrderRsvExt> {
  return api.post<OrderRsvExt>('/order-rsvs', payload).then((r) => r.data)
}

/** 예약 전체 수정 (PUT 교체). 응답으로 갱신된 aggregate 반환. */
export async function update(seq: number, payload: RsvUpdatePayload): Promise<OrderRsvExt> {
  return api.put<OrderRsvExt>(`/order-rsvs/${seq}`, payload).then((r) => r.data)
}

/** 예약 삭제. */
export async function remove(seq: number): Promise<void> {
  return api.delete(`/order-rsvs/${seq}`).then(() => undefined)
}
