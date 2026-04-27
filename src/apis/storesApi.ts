import type { Store } from '@/types/store'

import { api } from './api'

/** 매장 전체 조회. */
export async function fetchList(): Promise<Store[]> {
  return api.get<Store[]>('/stores').then((r) => r.data)
}

/** 매장 단건 조회. */
export async function fetchById(seq: number): Promise<Store | null> {
  return api.get<Store>(`/stores/${seq}`).then((r) => r.data)
}

// 2차 구현 예정
// export async function create(payload: Omit<Store, 'seq' | 'regAt' | 'modAt'>): Promise<Store>
// export async function update(seq: number, payload: Partial<Store>): Promise<Store>
// export async function remove(seq: number): Promise<void>
