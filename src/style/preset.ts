import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

/**
 * 천일식당 PrimeVue 프리셋
 *
 * - primary: 브랜드 그린 (#4FB395) 오버라이드
 * - surface: Figma 톤(살짝 초록빛 중성)으로 오버라이드.
 *   50/200/500/900 는 Figma 직접 매칭, 나머지는 자연스러운 보간.
 *   (Aura 의 text/content 가 surface.* 를 참조하므로 자동 반영)
 * - formField 폰트 크기는 theme.css 의 --text-* 토큰과 정렬
 *   (sm=12 / default=13 / lg=16) — docs/DESIGN_TOKENS.md 참고
 * - 나머지 severity 색상은 Aura 기본값 유지
 */
export const CheonilPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#E9F5EF',
      100: '#C9E8D6',
      200: '#A6D7B8',
      300: '#82C79A',
      400: '#67BC89',
      500: '#4FB395',
      600: '#3F9478',
      700: '#2F755C',
      800: '#1F5641',
      900: '#144432',
      950: '#0A2A1F',
    },
    formField: {
      sm: { fontSize: '0.75rem' },
      fontSize: '0.8125rem',
      lg: { fontSize: '1rem' },
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f7fafa',
          100: '#edf2f3',
          200: '#e0e5eb',
          300: '#c4ccd2',
          400: '#9aa3ab',
          500: '#73808c',
          600: '#5a6671',
          700: '#434d56',
          800: '#2d363d',
          900: '#212933',
          950: '#141920',
        },
      },
    },
  },
})
