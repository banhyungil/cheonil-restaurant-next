import type { DayType, OrderRsvTmplExt, OrderRsvTmplMenu } from '@/types/orderRsv'

import { api } from './api'

// ============================================================================
// 시그니처
// ============================================================================

/** 템플릿 목록 조회 파라미터. */
export interface RsvTmplsListParams {
  storeSeq?: number
  dayType?: DayType
  active?: boolean
}

/**
 * 템플릿 생성/수정 페이로드.
 * m_order_rsv_tmpl + m_order_rsv_menu[] 일괄 전달.
 */
export interface RsvTmplCreatePayload {
  storeSeq: number
  nm: string
  /** 'HH:mm:ss'. */
  rsvTime: string
  dayTypes: DayType[]
  /** 'YYYY-MM-DD'. 필수 — 백엔드 default = today 가 적용되긴 하지만 클라이언트가 명시. */
  startDt: string
  /** 'YYYY-MM-DD'. null = 무기한. */
  endDt?: string | null
  cmt?: string
  active: boolean
  /** 자동 주문 — 예약 시각 도래 시 주문 자동 생성. */
  autoOrder: boolean
  menus: Pick<OrderRsvTmplMenu, 'menuSeq' | 'price' | 'cnt'>[]
}

export type RsvTmplUpdatePayload = RsvTmplCreatePayload

/** 템플릿 페이지 통계 (목록에서 derive 가능 — 별도 endpoint 두지 않아도 됨). */
export interface RsvTmplStats {
  total: number
  active: number
  inactive: number
  /** 오늘 자동 생성된 인스턴스 수. 백엔드에서 별도 집계 필요. */
  generatedToday: number
}

// ============================================================================
// API 함수
// ============================================================================

/** 템플릿 목록 조회 (매장/메뉴 join aggregate). */
export async function fetchList(params?: RsvTmplsListParams): Promise<OrderRsvTmplExt[]> {
  return api.get<OrderRsvTmplExt[]>('/order-rsv-tmpls', { params }).then((r) => r.data)
}

/** 템플릿 단건 조회 (편집 페이지 hydrate 용 — 목록 데이터로 충분하면 호출 불필요). */
export async function fetchById(seq: number): Promise<OrderRsvTmplExt> {
  return api.get<OrderRsvTmplExt>(`/order-rsv-tmpls/${seq}`).then((r) => r.data)
}

/** 템플릿 생성. */
export async function create(payload: RsvTmplCreatePayload): Promise<OrderRsvTmplExt> {
  return api.post<OrderRsvTmplExt>('/order-rsv-tmpls', payload).then((r) => r.data)
}

/** 템플릿 전체 수정 (PUT 교체). */
export async function update(
  seq: number,
  payload: RsvTmplUpdatePayload,
): Promise<OrderRsvTmplExt> {
  return api.put<OrderRsvTmplExt>(`/order-rsv-tmpls/${seq}`, payload).then((r) => r.data)
}

/** 템플릿 활성 토글 — 목록 행의 토글에서 사용. */
export async function patchActive(seq: number, active: boolean): Promise<void> {
  return api.patch(`/order-rsv-tmpls/${seq}/active`, { active }).then(() => undefined)
}

/** 자동 주문 토글 — 목록 행의 토글에서 사용. */
export async function patchAutoOrder(seq: number, autoOrder: boolean): Promise<void> {
  return api.patch(`/order-rsv-tmpls/${seq}/auto-order`, { autoOrder }).then(() => undefined)
}

/** 템플릿 삭제. 연결된 인스턴스는 백엔드가 rsv_tmpl_seq=NULL 처리. */
export async function remove(seq: number): Promise<void> {
  return api.delete(`/order-rsv-tmpls/${seq}`).then(() => undefined)
}
