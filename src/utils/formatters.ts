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
