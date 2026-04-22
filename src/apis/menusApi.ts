import { DUMMY_MENU_CATEGORIES, DUMMY_MENUS } from '@/data/dummy/menus'
import type { Menu, MenuCategory } from '@/types/menu'

// import { api } from './api'

/**
 * 메뉴 전체 조회.
 * @todo 백엔드 구현 후 dummy 반환부를 axios 호출로 교체
 */
export async function fetchList(): Promise<Menu[]> {
  // return api.get<Menu[]>('/menus').then((r) => r.data)
  return [...DUMMY_MENUS]
}

/** 메뉴 단건 조회. */
export async function fetchById(seq: number): Promise<Menu | null> {
  // return api.get<Menu>(`/menus/${seq}`).then((r) => r.data)
  return DUMMY_MENUS.find((m) => m.seq === seq) ?? null
}

/** 메뉴 카테고리 전체 조회. */
export async function fetchCategoryList(): Promise<MenuCategory[]> {
  // return api.get<MenuCategory[]>('/menu-categories').then((r) => r.data)
  return [...DUMMY_MENU_CATEGORIES]
}

// 2차 구현 예정
// export async function create(payload: Omit<Menu, 'seq' | 'regAt' | 'modAt'>): Promise<Menu>
// export async function update(seq: number, payload: Partial<Menu>): Promise<Menu>
// export async function remove(seq: number): Promise<void>
