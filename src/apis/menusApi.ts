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

// 2차 구현 예정
// export async function create(payload: Omit<Menu, 'seq' | 'regAt' | 'modAt'>): Promise<Menu>
// export async function update(seq: number, payload: Partial<Menu>): Promise<Menu>
// export async function remove(seq: number): Promise<void>
