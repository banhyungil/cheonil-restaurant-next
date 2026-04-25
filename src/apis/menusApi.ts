import type { Menu } from '@/types/menu'

import { api } from './api'

/** 메뉴 전체 조회. */
export async function fetchList(): Promise<Menu[]> {
  return api.get<Menu[]>('/menus').then((r) => r.data)
}

/** 메뉴 단건 조회. */
export async function fetchById(seq: number): Promise<Menu | null> {
  return api.get<Menu>(`/menus/${seq}`).then((r) => r.data)
}

// 2차 구현 예정
// export async function create(payload: Omit<Menu, 'seq' | 'regAt' | 'modAt'>): Promise<Menu>
// export async function update(seq: number, payload: Partial<Menu>): Promise<Menu>
// export async function remove(seq: number): Promise<void>
