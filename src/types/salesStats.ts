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

/**
 * 점포별 메뉴 비중 — donut + list (TOP 4 + 기타).
 * 점포 분석 뷰에서 점포 select 변경 시 응답 일부 (해당 storeSeq 의 parts).
 */
export interface StoreMenuPart {
  storeSeq: number
  parts: { menuNm: string; count: number; percent: number }[]
  /** TOP 4 외 합산 건수. tooltip / footer 표시용. */
  etcCount: number
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
  hourly: HourBucket[]
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
  menusTop10: MenuRank[]
  categoryParts: CategoryPart[]
  popularByCash: MenuRank[]
  popularByCard: MenuRank[]
  /** 피크타임 (12시) 인기 메뉴 — backend 가 시간대 추출 후 ranking. */
  peakTimeMenus: MenuRank[]
}

/** 통계 - 점포 분석 뷰 응답. */
export interface StatsStore {
  stores: StoreSales[]
  /** 점포 select 따라 storeSeq 1개. 응답엔 array 라 차후 비교 모드 확장 여지. */
  storeMenuParts: StoreMenuPart[]
  orderCounts: StoreCount[]
  unpaidByStore: StoreUnpaid[]
  payDistribution: StorePayDistribution[]
}
