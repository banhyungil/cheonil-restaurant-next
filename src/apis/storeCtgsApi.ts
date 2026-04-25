import type { StoreCategory } from '@/types/store'

import { api } from './api'

/** 매장 카테고리 전체 조회. */
export async function fetchList(): Promise<StoreCategory[]> {
  return api.get<StoreCategory[]>('/store-categories').then((r) => r.data)
}

// 2차 구현 예정 (관리 페이지에서 사용)
// export async function fetchById(seq: number): Promise<StoreCategory | null>
// export async function create(payload: Omit<StoreCategory, 'seq' | 'regAt' | 'modAt'>): Promise<StoreCategory>
// export async function update(seq: number, payload: Partial<StoreCategory>): Promise<StoreCategory>
// export async function remove(seq: number): Promise<void>
