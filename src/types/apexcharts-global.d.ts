/**
 * vue3-apexcharts 가 글로벌 등록한 <Apexchart> 컴포넌트의 template 타입 인식.
 * (자동 import 가 아닌 plugin 글로벌 등록이라 components.d.ts 가 못 잡음)
 */
import type { VueApexChartsComponentProps } from 'vue3-apexcharts'

declare module 'vue' {
  interface GlobalComponents {
    Apexchart: import('vue').DefineComponent<VueApexChartsComponentProps>
  }
}

export {}
