import { useLocalStorage } from '@vueuse/core'
import { onBeforeUnmount, watch } from 'vue'

import type { OrderExt } from '@/types/order'
import { orderCreatedBus, orderUpdatedBus } from '@/utils/orderEventBus'

/**
 * 주문 음성 알림 (TTS).
 *
 * `useOrderStream` 이 발행하는 주문 이벤트를 구독해 Web Speech API 로 발화.
 * - `order:created` → "주문 접수, 주문, <메뉴들>"
 * - `order:updated` → "주문 수정, 주문 수정, <메뉴들>"
 *
 * 상태:
 * - `enabled` — localStorage 영속. 사용자 첫 클릭이 자동재생 정책의 user gesture 역할.
 *
 * 호출 위치: `OrdersMonitorPage` (매장 모니터 화면에서만 동작).
 */
const STORAGE_KEY_ENABLED = 'order-announcer-enabled'
const STORAGE_KEY_REPEAT = 'order-announcer-repeat'
const STORAGE_KEY_RATE = 'order-announcer-rate'

const REPEAT_MIN = 1
const REPEAT_MAX = 5

const RATE_MIN = 0.9
const RATE_MAX = 1.4
const RATE_STEP = 0.1
const RATE_DEFAULT = 1.2

export function useOrderAnnouncer() {
  const enabled = useLocalStorage(STORAGE_KEY_ENABLED, false)
  const repeatCount = useLocalStorage(STORAGE_KEY_REPEAT, 1)
  const rate = useLocalStorage(STORAGE_KEY_RATE, RATE_DEFAULT)

  function speak(text: string) {
    if (!enabled.value) return
    const times = Math.min(REPEAT_MAX, Math.max(REPEAT_MIN, repeatCount.value))
    for (let i = 0; i < times; i++) {
      const utterance = new SpeechSynthesisUtterance(text)

      // ─── SpeechSynthesisUtterance 옵션 (Web Speech API) ────────────────
      // 모두 기본값으로 명시. 매장 환경에 맞게 튜닝 시 값만 바꾸면 됨.

      /** 언어/로케일 — 한국어 음성 선택. default: '' (HTML lang 상속) */
      utterance.lang = 'ko-KR'

      /** 발화 속도 — 1.0 = 보통. 범위 0.1 ~ 10. default: 1
       *  매장 시끄러우면 0.9 정도로 천천히 발화 권장. UI 슬라이더로 조절. */
      utterance.rate = rate.value

      /** 음높이 — 1.0 = 보통. 범위 0 ~ 2. default: 1
       *  값↑ = 여성/높은 톤, 값↓ = 남성/낮은 톤 느낌. */
      utterance.pitch = 1.0

      /** 볼륨 — 0 ~ 1. default: 1 (시스템 볼륨에 곱해짐) */
      utterance.volume = 1.0

      /** 음성(화자) — null 이면 OS/브라우저 기본 한국어 화자 사용. default: null
       *  특정 화자 강제 시 speechSynthesis.getVoices() 결과 중 하나 할당.
       *  예) utterance.voice = speechSynthesis.getVoices().find(v => v.name === 'Yuna') ?? null */
      utterance.voice = null

      speechSynthesis.speak(utterance)
    }
  }

  function buildMenuText(order: OrderExt) {
    return order.menus.map((m) => m.menuNm).join(', ')
  }

  function announceCreated(order: OrderExt) {
    speak(`주문 접수, ${order.storeNm}, ${buildMenuText(order)}`)
  }

  function announceUpdated(order: OrderExt) {
    speak(`주문 수정, ${order.storeNm}, ${buildMenuText(order)}`)
  }

  // 토글 전환 — ON 시 사용자 클릭(user gesture) 직후 첫 발화로 autoplay 정책 통과 확인 겸 확신,
  // OFF 시 큐에 남은 발화 즉시 중단.
  watch(enabled, (v) => {
    if (v) speak('음성 알림 시작')
    else speechSynthesis.cancel()
  })

  const offCreated = orderCreatedBus.on(announceCreated)
  const offUpdated = orderUpdatedBus.on(announceUpdated)

  onBeforeUnmount(() => {
    offCreated()
    offUpdated()
    speechSynthesis.cancel()
  })

  return { enabled, repeatCount, rate, REPEAT_MIN, REPEAT_MAX, RATE_MIN, RATE_MAX, RATE_STEP }
}
