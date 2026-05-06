import type { ApexOptions } from 'apexcharts'

/**
 * ApexCharts 공통 옵션 helper — 우리 theme/typography/locale 매핑.
 *
 * 차트 wrapper 들이 import 해서 base options 위에 차트별 차이만 override.
 * theme.css 의 CSS variable (--p-primary-500 등) 은 SVG 에 직접 못 바르므로 정적 값.
 */

/** theme 토큰의 정적 fallback — primary/severity 팔레트와 일치. */
export const CHART_COLORS = {
  primary: '#10b981', // emerald-500 (= primary)
  primaryLight: '#a7f3d0', // emerald-200 (비교 series / 연한 막대)
  cash: '#10b981',
  card: '#3b82f6', // blue-500
  unpaid: '#ef4444', // red-500
  amber: '#f59e0b',
  surfaceText: '#475569', // slate-600
  surfaceMuted: '#94a3b8', // slate-400
  surfaceLine: '#e2e8f0', // slate-200
} as const

/** 천단위 콤마 + 단위 (원). */
export const fmtKRW = (n: number): string => `${n.toLocaleString('ko-KR')}원`
export const fmtCount = (n: number): string => `${n.toLocaleString('ko-KR')}건`

/**
 * 모든 차트 공통 base — chart toolbar 숨김, font / locale / no-data 메시지.
 * 사용처에서 deep merge 대신 spread 로 override.
 */
export const baseChartOptions: ApexOptions = {
  chart: {
    toolbar: { show: false },
    fontFamily: 'inherit',
    animations: { speed: 300 },
  },
  noData: {
    text: '데이터가 없습니다',
    style: { color: CHART_COLORS.surfaceMuted, fontSize: '13px' },
  },
  grid: {
    borderColor: CHART_COLORS.surfaceLine,
    strokeDashArray: 3,
  },
  legend: {
    fontSize: '12px',
    labels: { colors: CHART_COLORS.surfaceText },
  },
  tooltip: {
    style: { fontSize: '12px' },
    y: { formatter: (v: number) => fmtKRW(v) },
  },
  dataLabels: { enabled: false },
}
