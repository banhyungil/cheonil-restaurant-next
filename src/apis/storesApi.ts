import type { Store } from '@/types/store'

import { api } from './api'

/** 매장 목록 조회 파라미터. */
export interface StoresListParams {
  /** 비활성 매장 포함. default false → 활성만 (영업 그리드용). 관리 페이지는 true. */
  includeInactive?: boolean
}

/** 매장 전체 조회. */
export async function fetchList(params?: StoresListParams): Promise<Store[]> {
  return api.get<Store[]>('/stores', { params }).then((r) => r.data)
}

/** 매장 단건 조회. */
export async function fetchById(seq: number): Promise<Store | null> {
  return api.get<Store>(`/stores/${seq}`).then((r) => r.data)
}

/** 활성 토글. */
export async function patchActive(seq: number, active: boolean): Promise<void> {
  return api.patch(`/stores/${seq}/active`, { active }).then(() => undefined)
}

// 2차 구현 예정
// export async function create(payload: Omit<Store, 'seq' | 'regAt' | 'modAt'>): Promise<Store>
// export async function update(seq: number, payload: Partial<Store>): Promise<Store>
// export async function remove(seq: number): Promise<void>
