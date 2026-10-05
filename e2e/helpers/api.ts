import { expect, type APIRequestContext, type Page } from '@playwright/test'

/**
 * e2e 공용 헬퍼 — 선행 데이터는 화면 대신 백엔드 API 로 바로 만든다.
 * 테스트끼리 같은 DB 를 쓰므로 이름에는 uid() suffix 를 붙여 충돌을 피한다.
 */

const API = 'http://localhost:18081/api'

/** 테스트 데이터 이름용 짧은 고유값. */
export function uid() {
  return Math.random().toString(36).slice(2, 7)
}

async function post<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
  const res = await request.post(`${API}${path}`, { data })
  expect(res.ok(), `${path} ${res.status()} ${await res.text()}`).toBeTruthy()
  return res.json()
}

export interface UnitRes {
  seq: number
  nm: string
}
export function createUnit(
  request: APIRequestContext,
  data: { nm: string; isUnitCnt: boolean; baseUnitSeq?: number; baseFactor?: number },
) {
  return post<UnitRes>(request, '/units', {
    baseUnitSeq: null,
    baseFactor: null,
    ...data,
  })
}

export interface ExpenseCtgRes {
  seq: number
  path: string
  parentSeq: number | null
  nm: string
}
export function createExpenseCtg(
  request: APIRequestContext,
  data: { nm: string; parentSeq?: number | null },
) {
  return post<ExpenseCtgRes>(request, '/expense-categories', { parentSeq: null, ...data })
}
export async function fetchExpenseCtgs(request: APIRequestContext): Promise<ExpenseCtgRes[]> {
  return (await request.get(`${API}/expense-categories`)).json()
}

export function createProduct(
  request: APIRequestContext,
  data: { ingdNm: string; nm: string; unitSeq: number; unitCnts?: number[] },
) {
  return post<{ seq: number }>(request, '/products', { unitCnts: [], ...data })
}

export function createStore(request: APIRequestContext, data: { nm: string }) {
  return post<{ seq: number; nm: string }>(request, '/stores', { ctgSeq: 1, ...data })
}

export function createExpense(
  request: APIRequestContext,
  data: { ctgSeq: number; nm: string; amount: number; expenseDt: string; storeSeq?: number },
) {
  return post<{ seq: number }>(request, '/expenses', { storeSeq: null, cmt: null, ...data })
}

/** 오늘 'YYYY-MM-DD' (로컬 = 브라우저와 같은 TZ). */
export function today() {
  return new Date().toLocaleDateString('sv-SE')
}

/** 셀 텍스트가 정확히 일치하는 테이블 행 — 부분 일치면 '채소' 가 '잎채소' 행까지 잡는다. */
export function row(page: Page, text: string) {
  return page.getByRole('row').filter({ has: page.getByText(text, { exact: true }) })
}

/** 확인 다이얼로그(ConfirmDialog) 수락. */
export function acceptConfirm(page: Page) {
  return page.locator('.p-confirmdialog-accept-button').click()
}

/** 토스트 메시지 노출 확인. */
export function expectToast(page: Page, text: string | RegExp) {
  return expect(page.locator('.p-toast-message').filter({ hasText: text })).toBeVisible()
}
