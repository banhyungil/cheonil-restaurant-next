/** 메뉴 카테고리 (m_menu_category) */
export interface MenuCategory {
  seq: number
  nm: string
  options?: Record<string, unknown> | null
  regAt?: string
  modAt?: string
}

/** 메뉴 (m_menu) */
export interface Menu {
  seq: number
  ctgSeq: number
  nm: string
  /** 짧은 이름 / 약칭 */
  nmS?: string | null
  /** 가격 (원) */
  price: number
  cmt?: string | null
  /** 활성 여부 — false 면 영업 그리드에 노출 X. */
  active: boolean
  options?: Record<string, unknown> | null
  regAt?: string
  modAt?: string
}
