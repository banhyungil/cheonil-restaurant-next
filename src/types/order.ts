/** 주문 상태. */
export type OrderStatus = 'READY' | 'COOKED' | 'PAID'

/** 주문 (t_order). */
export interface Order {
  seq: number
  storeSeq: number
  /** 예약 주문일 때만 값 존재. */
  rsvSeq?: number | null
  amount: number
  status: OrderStatus
  orderAt: string
  /** 조리 완료 시각 (READY 상태에서는 null). */
  cookedAt?: string | null
  cmt?: string | null
  modAt?: string
}

/** 주문 메뉴 (t_order_menu). */
export interface OrderMenu {
  menuSeq: number
  orderSeq: number
  /** 주문 시점 메뉴 가격. */
  price: number
  cnt: number
}

/** 주문 메뉴 + 메뉴 정보 (t_order_menu JOIN m_menu). */
export interface OrderMenuExt extends OrderMenu {
  menuNm: string
  menuNmS?: string | null
}

/**
 * 주문현황용 aggregate.
 * t_order + m_store(nm, cmt) + t_order_menu[] + m_menu(nm) join 결과.
 */
export interface OrderExt extends Order {
  storeNm: string
  /** 매장 비고 — 카드 ⓘ tooltip 표시용. */
  storeCmt?: string | null
  menus: OrderMenuExt[]
}
