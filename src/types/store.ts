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
  options?: Record<string, unknown> | null
  regAt?: string
  modAt?: string
}
