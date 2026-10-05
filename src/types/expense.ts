/** 지출 카테고리 (m_expense_category) — 서버는 flat 리스트로 내려주고 프론트에서 트리로 조립. */
export interface ExpenseCategory {
  seq: number
  /** ltree 경로 (seq 라벨, 예: "1.5.12"). */
  path: string
  /** 상위 카테고리. 최상위면 null. */
  parentSeq: number | null
  nm: string
}

/** 지출 (t_expense) — 일자 단위. 같은 일자 + 같은 매장 지출은 하나만 존재. */
export interface Expense {
  seq: number
  ctgSeq: number
  /** 구입처 매장. 공과금 등 매장 없는 지출은 null. */
  storeSeq: number | null
  nm: string
  amount: number
  /** 지출일자 'YYYY-MM-DD' (KST). */
  expenseDt: string
  cmt: string | null
  regAt: string
  modAt: string
}
