import type { Expense } from '@/types/expense'

import { api } from './api'

/** 지출 목록 조회 파라미터 — 기간 필수 (UI 가드: 90일 이내). */
export interface ExpensesParams {
  /** 'YYYY-MM-DD'. */
  from: string
  to: string
  /** 카테고리 — 하위 카테고리 지출까지 포함. */
  ctgSeq?: number
  storeSeq?: number
  /** 지출명 부분 일치. */
  q?: string
}

/** 지출 생성/수정 페이로드 (PUT 전체 교체). 같은 일자 + 같은 매장 지출이 이미 있으면 400. */
export interface ExpenseSavePayload {
  ctgSeq: number
  storeSeq: number | null
  nm: string
  amount: number
  /** 'YYYY-MM-DD'. */
  expenseDt: string
  cmt: string | null
}

/** 지출 목록 — 전체 응답 (클라 페이징), 최신 일자순. */
export async function fetchList(params: ExpensesParams): Promise<Expense[]> {
  return api.get<Expense[]>('/expenses', { params }).then((r) => r.data)
}

/** 같은 일자 + 같은 매장 기존 지출. 없으면 null (204). */
export async function lookup(date: string, storeSeq: number): Promise<Expense | null> {
  return api
    .get<Expense | ''>('/expenses/lookup', { params: { date, storeSeq } })
    .then((r) => (r.status === 204 || !r.data ? null : r.data))
}

/** 카테고리에서 쓴 지출명 — 최근 사용순. */
export async function fetchNames(ctgSeq: number): Promise<string[]> {
  return api.get<string[]>('/expenses/names', { params: { ctgSeq } }).then((r) => r.data)
}

/** 지출 생성. */
export async function create(payload: ExpenseSavePayload): Promise<Expense> {
  return api.post<Expense>('/expenses', payload).then((r) => r.data)
}

/** 지출 전체 수정 (PUT 교체). */
export async function update(seq: number, payload: ExpenseSavePayload): Promise<Expense> {
  return api.put<Expense>(`/expenses/${seq}`, payload).then((r) => r.data)
}

/** 지출 삭제 — 품목도 함께 삭제. */
export async function remove(seq: number): Promise<void> {
  return api.delete(`/expenses/${seq}`).then(() => undefined)
}
