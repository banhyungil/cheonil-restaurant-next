import { vTooltip as raw } from 'floating-vue'

import type { Directive } from 'vue'

/**
 * floating-vue 의 v-tooltip 디렉티브 wrapper.
 *
 * 라이브러리 자체 binding value 가 `any` 라 호출부에서 자동완성·타입 검증이 안 되는 한계를 해결.
 * 동작은 raw 그대로, 타입만 좁힘.
 *
 * 디렉티브 등록은 `app.use(FloatingVue)` 가 자동 처리하므로 main.ts 추가 작업 불필요.
 * GlobalDirectives 선언은 [src/types/directives.d.ts](../types/directives.d.ts).
 *
 * @example
 *   <BButton v-tooltip="'수정'" />
 *   <BButton v-tooltip="{ content: '수정', placement: 'bottom' }" />
 */
export interface TooltipOptions {
  /** 툴팁 컨텐츠 (text — `html: true` 시 HTML). */
  content: string
  /** 등록된 theme. 기본 'tooltip' 은 cheonil 디자인 토큰으로 override 됨. */
  theme?: 'tooltip' | 'dropdown'
  placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end'
  /** content 를 HTML 로 렌더링. 신뢰된 문자열만 — XSS 주의. */
  html?: boolean
  delay?: { show?: number; hide?: number }
  triggers?: ('hover' | 'focus' | 'click' | 'touch')[]
  /** 외부 boolean 으로 표시 제어 (hover/click 외 임의 시점). */
  shown?: boolean
  /** 강제 비활성. */
  disabled?: boolean
  /** popper 외부에 추가할 css class. */
  popperClass?: string | string[]
}

export const vTooltip: Directive<HTMLElement, string | TooltipOptions> = raw
