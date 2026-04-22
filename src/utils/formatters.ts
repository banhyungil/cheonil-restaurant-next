/**
 * 숫자를 한국 원화 표기로 포맷.
 * @example formatWon(8000) // "8,000원"
 */
export function formatWon(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`
}
