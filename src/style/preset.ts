import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

/**
 * 천일식당 PrimeVue 프리셋
 *
 * - primary 팔레트만 브랜드 그린(#4FB395 기반)으로 덮어씀
 * - success/warn/danger/info 등 severity 색상은 Aura 기본값 유지
 *   (Button severity="success" 등이 자연스럽게 동작)
 * - surface 는 Aura slate 그대로 사용 (Figma #F7FAFA ≈ slate.50)
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
  },
})
