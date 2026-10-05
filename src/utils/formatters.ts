/**
 * 숫자를 한국 원화 표기로 포맷.
 * @example formatWon(8000) // "8,000원"
 */
export function formatWon(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`
}

/**
 * 제품 규격 표기 — 단위수량 + 단위명.
 * @example formatUnitCnt(600, 'g') // "600g", formatUnitCnt(1.8, 'L') // "1.8L"
 */
export function formatUnitCnt(cnt: number, unitNm: string): string {
  return `${cnt.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}${unitNm}`
}

/**
 * 제품 표시명 — 규격이 있으면 "삼겹살 600g", 없으면 "대파 (단)".
 * @param unitCnt 구입 규격. null 이면 단위만 표기
 */
export function formatProductNm(nm: string, unitNm: string, unitCnt: number | null): string {
  return unitCnt != null ? `${nm} ${formatUnitCnt(unitCnt, unitNm)}` : `${nm} (${unitNm})`
}
