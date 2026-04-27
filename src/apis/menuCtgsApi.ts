import type { MenuCategory } from '@/types/menu'

import { api } from './api'

/** 메뉴 카테고리 전체 조회. */
export async function fetchList(): Promise<MenuCategory[]> {
  return api.get<MenuCategory[]>('/menu-categories').then((r) => r.data)
}

// 2차 구현 예정 (관리 페이지에서 사용)
// export async function fetchById(seq: number): Promise<MenuCategory | null>
// export async function create(payload: Omit<MenuCategory, 'seq' | 'regAt' | 'modAt'>): Promise<MenuCategory>
// export async function update(seq: number, payload: Partial<MenuCategory>): Promise<MenuCategory>
// export async function remove(seq: number): Promise<void>
