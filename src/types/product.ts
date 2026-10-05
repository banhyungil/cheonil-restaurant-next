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
