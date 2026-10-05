/** 지출 카테고리 (m_expense_category) — 서버는 flat 리스트로 내려주고 프론트에서 트리로 조립. */
export interface ExpenseCategory {
  seq: number
  /** ltree 경로 (seq 라벨, 예: "1.5.12"). */
  path: string
  /** 상위 카테고리. 최상위면 null. */
  parentSeq: number | null
  nm: string
}
