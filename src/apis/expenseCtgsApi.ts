import type { ExpenseCategory } from '@/types/expense'

import { api } from './api'

/**
 * 지출 카테고리 생성/수정 페이로드 (PUT 전체 교체).
 * PUT 에서 parentSeq 가 바뀌면 하위 트리째 이동한다. null 이면 최상위.
 */
export interface ExpenseCtgSavePayload {
  parentSeq: number | null
  nm: string
}

/** 지출 카테고리 전체 조회 (flat, path 순). */
export async function fetchList(): Promise<ExpenseCategory[]> {
  return api.get<ExpenseCategory[]>('/expense-categories').then((r) => r.data)
}

/** 지출 카테고리 생성. */
export async function create(payload: ExpenseCtgSavePayload): Promise<ExpenseCategory> {
  return api.post<ExpenseCategory>('/expense-categories', payload).then((r) => r.data)
}

/** 지출 카테고리 전체 수정 (PUT 교체) — 이름 변경 / 이동. */
export async function update(seq: number, payload: ExpenseCtgSavePayload): Promise<ExpenseCategory> {
  return api.put<ExpenseCategory>(`/expense-categories/${seq}`, payload).then((r) => r.data)
}

/** 지출 카테고리 삭제. 하위 카테고리나 연결된 지출이 있으면 400. */
export async function remove(seq: number): Promise<void> {
  return api.delete(`/expense-categories/${seq}`).then(() => undefined)
}
