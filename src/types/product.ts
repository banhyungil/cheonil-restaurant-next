/** 단위 (m_unit) */
export interface Unit {
  seq: number
  nm: string
  /** 단위수량 사용 여부 — true 면 제품 등록 시 규격(600g 등) 입력 활성화. */
  isUnitCnt: boolean
  /** 기준 단위 (g → kg). null 이면 자기 자신이 기준 단위. */
  baseUnitSeq: number | null
  /** 기준 단위 환산계수 (g → 0.001). baseUnitSeq 가 있을 때만 값 존재. */
  baseFactor: number | null
}

/** 식자재 (m_ingredient) — 같은 식자재의 제품 간 가격 비교 기준. */
export interface Ingredient {
  seq: number
  nm: string
  /** 이 식자재에 속한 제품 수. */
  productCnt: number
}

/**
 * 제품 = 제품정보(식자재 + 제품명) + 단위. 식자재 / 단위 이름이 조인되어 내려온다.
 * 같은 제품명의 다른 단위(삼겹살 g / kg)는 prdInfoSeq 를 공유한다.
 */
export interface Product {
  seq: number
  ingdSeq: number
  ingdNm: string
  prdInfoSeq: number
  nm: string
  unitSeq: number
  unitNm: string
  /** 자주 쓰는 규격 목록 (예: [500, 600]). 단위수량 미사용 단위면 빈 배열. */
  unitCnts: number[]
}
