/** 매장 카테고리 (m_store_category) */
export interface StoreCategory {
  seq: number
  nm: string
  options?: Record<string, unknown> | null
  regAt?: string
  modAt?: string
}

/** 매장 / 지점 (m_store) */
export interface Store {
  seq: number
  ctgSeq: number
  nm: string
  addr?: string | null
  cmt?: string | null
  latitude?: number | null
  longitude?: number | null
  /** 활성 여부 — false 면 영업 그리드에 노출 X. */
  active: boolean
  /** 판매처 — 주문 / 예약 매장 선택 대상. */
  isSale: boolean
  /** 구매처 — 지출 구입처 선택 대상. */
  isPurchase: boolean
  options?: Record<string, unknown> | null
  regAt?: string
  modAt?: string
}
