/**
 * 주문내역관리 - 통계 탭 응답 타입.
 * 백엔드 aggregate endpoint 들이 반환하는 분석 데이터.
 *
 * 3 개 sub-view (기본 / 메뉴 분석 / 점포 분석) + 매출 추이 차트 1개 분리.
 */

/** 시간대별 매출 — 09~20시 (영업 시간) bucket. */
export interface HourBucket {
  /** 0~23. 보통 9~20. */
  hour: number
  amount: number
}

/**
 * 시간대별 메뉴 판매 stacked — 메뉴 분석 뷰.
 *
 * 시간(hour) × 메뉴(menus) cross-tab.
 * `menus` 는 TOP 5 메뉴명 + 마지막 '기타' (총 6개) — 모든 hour 에 대해 동일 순서/길이.
 * `hours[].counts.length === menus.length` 보장 (해당 시간 미판매면 0).
 */
export interface StatsHourMenuStack {
  /** 메뉴명 series 키 — TOP 5 + '기타'. */
  menus: string[]
  /** 시간 bucket 별 메뉴 판매 수량 (menus 와 같은 인덱스). */
  hours: { hour: number; counts: number[] }[]
}

/** 매출 추이 차트의 한 점 — granularity 단위 라벨 + 합계. */
export interface TrendPoint {
  /** '월' / '4/15' / '04월' 등 granularity 따라 다름. */
  label: string
  amount: number
}

/** 메뉴 ranking row — TOP N 차트/list 공용. */
export interface MenuRank {
  menuNm: string
  count: number
  amount: number
}

/** 카테고리별 매출 도넛 한 조각. */
export interface CategoryPart {
  ctgNm: string
  /** 0~100. */
  percent: number
  amount: number
}

/** 점포별 매출 ranking. */
export interface StoreSales {
  storeSeq: number
  storeNm: string
  amount: number
}

/** 점포별 주문 건수. */
export interface StoreCount {
  storeSeq: number
  storeNm: string
  count: number
}

/** 점포별 미수 — 점포 분석 뷰의 미수 현황 카드. */
export interface StoreUnpaid {
  storeSeq: number
  storeNm: string
  amount: number
  count: number
}

/** 점포별 결제방식 분포 — stacked bar. */
export interface StorePayDistribution {
  storeSeq: number
  storeNm: string
  cash: number
  card: number
  unpaid: number
}


/** 결제유형 비율 — 도넛 1조각 (현금/카드/미수). */
export interface PayMethodPart {
  payType: 'CASH' | 'CARD' | 'UNPAID'
  amount: number
  /** 0~100. */
  percent: number
}

/** 매출 추이 차트의 시간 집계 단위. */
export type StatsGranularity = 'day' | 'week' | 'month'

/** 통계 - 기본 뷰 응답. granularity 무관 (단순 집계). */
export interface StatsBasic {
  /** 헤더 우측 KPI 칩용 — 현재 기간 총 매출 + 직전 동일 길이 비교. */
  totalSales: number
  prevSales: number
  totalCount: number
  prevCount: number
  hourlys: HourBucket[]
  storesTop5: StoreSales[]
  payParts: PayMethodPart[]
  menusTop5: MenuRank[]
}

/** 매출 추이 차트 전용 응답 — 차트 로컬 granularity segment 변경 시만 호출. */
export interface StatsTrend {
  granularity: StatsGranularity
  /** 현재 기간 buckets. */
  trend: TrendPoint[]
  /** 직전 동일 길이 비교 기간 buckets. */
  trendPrev: TrendPoint[]
}

/** 통계 - 메뉴 분석 뷰 응답. */
export interface StatsMenu {
  /** 수량 기준 TOP 10. */
  menusTop10: MenuRank[]
  /** 판매액 기준 TOP 10 — "잘 팔리는" vs "매출 큰" 메뉴 비교용. */
  menusTop10ByAmount: MenuRank[]
  categoryParts: CategoryPart[]
  /** 시간대별 메뉴 판매 stacked — 시간×메뉴 mix 분석 (TOP 5 + 기타). */
  hourlyMenuStack: StatsHourMenuStack
}

/**
 * 점포별 메뉴 mix — 매장마다 자체 TOP 5 + 기타.
 * mini donut grid 용 — 매장간 비교가 아닌 매장 특색 (mix 패턴) 분석.
 */
export interface StoreMenuMix {
  storeSeq: number
  storeNm: string
  /** 매장 자체 TOP 5. */
  parts: { menuNm: string; count: number; percent: number }[]
  /** TOP 5 외 합산 건수. */
  etcCount: number
}

/** 통계 - 점포 분석 뷰 응답. */
export interface StatsStore {
  stores: StoreSales[]
  /** 점포별 메뉴 mix — 모든 매장 데이터 (frontend 가 multi-select 필터). */
  storeMenuMixes: StoreMenuMix[]
  orderCounts: StoreCount[]
  unpaidByStore: StoreUnpaid[]
  payDistribution: StorePayDistribution[]
}
