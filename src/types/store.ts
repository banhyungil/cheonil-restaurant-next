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
  options?: Record<string, unknown> | null
  regAt?: string
  modAt?: string
}
