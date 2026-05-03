/** 예약 상태 (rsv_status). */
export type RsvStatus = 'RESERVED' | 'COMPLETED' | 'CANCELED'

/** 요일 (day_type). */
export type DayType = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

/** 예약 인스턴스 (t_order_rsv). */
export interface OrderRsv {
  seq: number
  storeSeq: number
  /** 템플릿 유래일 때만 값 존재. null = 일회성. */
  rsvTmplSeq?: number | null
  orderSeq?: number | null
  amount: number
  /** 예약 일시 (ISO). */
  rsvAt: string
  status: RsvStatus
  /** 비고. 백엔드 컬럼 미존재 시 null. */
  cmt?: string | null
  regAt: string
  modAt: string
}

/** 예약 메뉴 (t_order_rsv_menu). */
export interface OrderRsvMenu {
  menuSeq: number
  rsvSeq: number
  /** 예약 시점 메뉴 가격 (스냅샷). */
  price: number
  cnt: number
}

/** 예약 메뉴 + 메뉴 정보 (t_order_rsv_menu JOIN m_menu). */
export interface OrderRsvMenuExt extends OrderRsvMenu {
  menuNm: string
  menuNmS?: string | null
}

/**
 * 예약 카드용 aggregate.
 * t_order_rsv + m_store(nm, cmt) + m_order_rsv_tmpl(nm) + t_order_rsv_menu[] + m_menu(nm) join 결과.
 */
export interface OrderRsvExt extends OrderRsv {
  storeNm: string
  /** 매장 비고 — 카드 ⓘ tooltip 표시용. */
  storeCmt?: string | null
  /** 템플릿 유래일 때 템플릿명. 일회성이면 null. */
  tmplNm?: string | null
  menus: OrderRsvMenuExt[]
}

/** 예약 템플릿 (m_order_rsv_tmpl). */
export interface OrderRsvTmpl {
  seq: number
  storeSeq: number
  /** 템플릿명 (단골 식별용). */
  nm: string
  amount: number
  /** 예약 시각 'HH:mm:ss'. */
  rsvTime: string
  dayTypes: DayType[]
  cmt?: string | null
  active: boolean
  /** 자동 주문 — 예약 시각 도래 시 주문(`t_order`) 자동 생성 여부. */
  autoOrder: boolean
  /** 패턴 시작일 'YYYY-MM-DD'. NOT NULL — 미입력 시 백엔드 default = today. */
  startDt: string
  /** 패턴 종료일 'YYYY-MM-DD'. null = 무기한. */
  endDt?: string | null
  regAt: string
  modAt: string
}

/** 템플릿 메뉴 (m_order_rsv_menu). */
export interface OrderRsvTmplMenu {
  menuSeq: number
  rsvTmplSeq: number
  price: number
  cnt: number
}

/** 템플릿 메뉴 + 메뉴 정보 join. */
export interface OrderRsvTmplMenuExt extends OrderRsvTmplMenu {
  menuNm: string
  menuNmS?: string | null
}

/**
 * 템플릿 목록용 aggregate.
 * m_order_rsv_tmpl + m_store(nm) + m_order_rsv_menu[] + m_menu(nm) join 결과.
 */
export interface OrderRsvTmplExt extends OrderRsvTmpl {
  storeNm: string
  menus: OrderRsvTmplMenuExt[]
}
