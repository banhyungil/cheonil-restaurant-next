import type { Unit } from '@/types/product'

import { api } from './api'

/**
 * 단위 생성/수정 페이로드 (PUT 전체 교체).
 * baseUnitSeq null 이면 자기 자신이 기준 단위 — baseFactor 는 무시된다.
 */
export interface UnitSavePayload {
  nm: string
  isUnitCnt: boolean
  baseUnitSeq: number | null
  baseFactor: number | null
}

/** 단위 전체 조회. */
export async function fetchList(): Promise<Unit[]> {
  return api.get<Unit[]>('/units').then((r) => r.data)
}

/** 단위 생성. */
export async function create(payload: UnitSavePayload): Promise<Unit> {
  return api.post<Unit>('/units', payload).then((r) => r.data)
}

/** 단위 전체 수정 (PUT 교체). */
export async function update(seq: number, payload: UnitSavePayload): Promise<Unit> {
  return api.put<Unit>(`/units/${seq}`, payload).then((r) => r.data)
}

/** 단위 삭제. 사용 중인 제품이 있거나 다른 단위의 기준 단위면 400. */
export async function remove(seq: number): Promise<void> {
  return api.delete(`/units/${seq}`).then(() => undefined)
}
