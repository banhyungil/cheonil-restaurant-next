import type { Menu } from '@/types/menu'

import { api } from './api'

/** 메뉴 목록 조회 파라미터. */
export interface MenusListParams {
  /** 비활성 메뉴 포함. default false → 활성만 (영업 그리드용). 관리 페이지는 true. */
  includeInactive?: boolean
}

/** 메뉴 전체 조회. */
export async function fetchList(params?: MenusListParams): Promise<Menu[]> {
  return api.get<Menu[]>('/menus', { params }).then((r) => r.data)
}

/** 메뉴 단건 조회. */
export async function fetchById(seq: number): Promise<Menu | null> {
  return api.get<Menu>(`/menus/${seq}`).then((r) => r.data)
}

/** 활성 토글. */
export async function patchActive(seq: number, active: boolean): Promise<void> {
  return api.patch(`/menus/${seq}/active`, { active }).then(() => undefined)
}

/**
 * 메뉴 생성/수정 페이로드 (PUT 전체 교체).
 * active 미지정 시 백엔드 default(true) 사용.
 */
export interface MenuCreatePayload {
  ctgSeq: number
  nm: string
  /** 메뉴명 축약 — 좁은 영역(주방화면/면수표) 표시용. 최대 4자 권장. */
  nmS: string
  /** 가격 (원). */
  price: number
  cmt?: string
  active?: boolean
}

export type MenuUpdatePayload = MenuCreatePayload

/** 메뉴 생성. */
export async function create(payload: MenuCreatePayload): Promise<Menu> {
  return api.post<Menu>('/menus', payload).then((r) => r.data)
}

/** 메뉴 전체 수정 (PUT 교체). */
export async function update(seq: number, payload: MenuUpdatePayload): Promise<Menu> {
  return api.put<Menu>(`/menus/${seq}`, payload).then((r) => r.data)
}

/** 메뉴 삭제. */
export async function remove(seq: number): Promise<void> {
  return api.delete(`/menus/${seq}`).then(() => undefined)
}
