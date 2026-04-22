import { DUMMY_STORE_CATEGORIES, DUMMY_STORES } from '@/data/dummy/stores'
import type { Store, StoreCategory } from '@/types/store'

// import { api } from './api'

/**
 * 매장 전체 조회.
 * @todo 백엔드 구현 후 dummy 반환부를 axios 호출로 교체
 */
export async function fetchList(): Promise<Store[]> {
  // return api.get<Store[]>('/stores').then((r) => r.data)
  return [...DUMMY_STORES]
}

/** 매장 단건 조회. */
export async function fetchById(seq: number): Promise<Store | null> {
  // return api.get<Store>(`/stores/${seq}`).then((r) => r.data)
  return DUMMY_STORES.find((s) => s.seq === seq) ?? null
}

/** 매장 카테고리 전체 조회. */
export async function fetchCategoryList(): Promise<StoreCategory[]> {
  // return api.get<StoreCategory[]>('/store-categories').then((r) => r.data)
  return [...DUMMY_STORE_CATEGORIES]
}

// 2차 구현 예정
// export async function create(payload: Omit<Store, 'seq' | 'regAt' | 'modAt'>): Promise<Store>
// export async function update(seq: number, payload: Partial<Store>): Promise<Store>
// export async function remove(seq: number): Promise<void>
