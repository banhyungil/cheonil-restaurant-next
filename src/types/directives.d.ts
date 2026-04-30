import 'vue'

import type { vTooltip } from '@/directives/vTooltip'

/**
 * 글로벌 디렉티브 타입 등록.
 * Vue 3.5+ Volar 의 `GlobalDirectives` 인터페이스를 통해 호출부에서 typed.
 * 실제 등록은 floating-vue plugin 이 처리 — 여기선 타입 정보만 연결.
 */
declare module 'vue' {
  interface GlobalDirectives {
    vTooltip: typeof vTooltip
  }
}
