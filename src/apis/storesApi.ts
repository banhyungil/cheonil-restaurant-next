import type { Store } from '@/types/store'

import { api } from './api'

/** 매장 목록 조회 파라미터. */
export interface StoresListParams {
  /** 비활성 매장 포함. default false → 활성만 (영업 그리드용). 관리 페이지는 true. */
  includeInactive?: boolean
}

/**
 * 매장 생성/수정 페이로드 (PUT 전체 교체).
 * active 미지정 시 백엔드 default(true) 사용.
 */
export interface StoreCreatePayload {
  ctgSeq: number
  nm: string
  /** 구역 — 위치 정보 (예: '원예 6번지 · B동 3층'). */
  addr?: string
  cmt?: string
  active?: boolean
}

export type StoreUpdatePayload = StoreCreatePayload

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

/** 매장 생성. config 로 silent 등 axios 옵션 전달 가능. */
export async function create(
  payload: StoreCreatePayload,
  config?: { silent?: boolean },
): Promise<Store> {
  return api.post<Store>('/stores', payload, config).then((r) => r.data)
}

/** 매장 전체 수정 (PUT 교체). */
export async function update(
  seq: number,
  payload: StoreUpdatePayload,
  config?: { silent?: boolean },
): Promise<Store> {
  return api.put<Store>(`/stores/${seq}`, payload, config).then((r) => r.data)
}

/** 매장 삭제. */
export async function remove(seq: number): Promise<void> {
  return api.delete(`/stores/${seq}`).then(() => undefined)
}
