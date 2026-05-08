import { promiseTimeout, useLocalStorage } from '@vueuse/core'
import {
  computed,
  type MaybeRefOrGetter,
  onActivated,
  onDeactivated,
  toValue,
  watch,
  type WatchStopHandle,
} from 'vue'

import type { OrderExt } from '@/types/order'
import { clearAnnounceQueue, enqueueAnnounce, playAlert, speakAsync } from '@/utils/announceQueue'
import { orderCreatedBus, orderUpdatedBus } from '@/utils/orderEventBus'

/**
 * 주문 음성 알림 (이벤트 발화 + 임계치 알람 통합).
 *
 * 두 가지 트리거를 한 곳에서 처리:
 *  1. SSE 주문 이벤트 — `useOrderStream` 발행 버스 구독
 *     - `order:created` → Door Bell + "<매장명>, <메뉴들>" (반복 N회)
 *     - `order:updated` → Door Bell + "주문 수정, <매장명>, <메뉴들>"
 *  2. READY 카운트 임계치 — orders ref 의 변화 감시
 *     - 9 ↓ → 10 ↑  : CRAZY (폭주)
 *     - 1 ↑ → 0    : CLEAR (전부 처리)
 *     - 0   → 1 ↑  : WELCOME (첫 주문)
 *
 * 모든 발화는 단일 큐(`announceQueue`) 직렬화 → 사운드 겹침 없음.
 * `OrdersMonitorPage` 가 keepAlive 이므로 `onActivated`/`onDeactivated` 로 활성 lifecycle 제어 —
 * 다른 페이지 체류 시 SSE 갱신/임계치 변화에 무반응.
 *
 * 설정은 모듈 레벨 singleton (LocalStorage):
 *  - 마스터: enabled / repeat / rate
 *  - 임계치: alertCrazy / alertClear / alertWelcome (개별 ON/OFF)
 *
 * 호출 위치: `OrderAnnouncerButton` (매장 모니터 화면 헤더 단일 인스턴스).
 */

const STORAGE_KEY_ENABLED = 'order-announcer-enabled'
const STORAGE_KEY_REPEAT = 'order-announcer-repeat'
const STORAGE_KEY_RATE = 'order-announcer-rate'
const STORAGE_KEY_PITCH = 'order-announcer-pitch'
const STORAGE_KEY_ALERT_CRAZY = 'order-announcer-alert-crazy'
const STORAGE_KEY_ALERT_CLEAR = 'order-announcer-alert-clear'
const STORAGE_KEY_ALERT_WELCOME = 'order-announcer-alert-welcome'
const STORAGE_KEY_PRESETS = 'order-announcer-presets'

/** 임의 발화 프리셋 최대 개수. */
export const PRESET_MAX_COUNT = 10
/** 프리셋 / 임의 발화 텍스트 최대 길이 (자). */
export const PRESET_MAX_LEN = 30

const REPEAT_MIN = 1
const REPEAT_MAX = 5

const RATE_MIN = 0.9
const RATE_MAX = 2.0
const RATE_STEP = 0.1
const RATE_DEFAULT = 1.2

const PITCH_MIN = 0.5
const PITCH_MAX = 2.0
const PITCH_STEP = 0.1
const PITCH_DEFAULT = 1.0

/** 폭주 알람 임계치 — 추후 설정 화면으로 이관 가능. */
const THRESHOLD_BUSY = 10

// ─── 모듈 레벨 settings (singleton, useSidebarCollapsed 패턴) ─────────
export const announcerEnabled = useLocalStorage(STORAGE_KEY_ENABLED, true)
export const announcerRepeat = useLocalStorage(STORAGE_KEY_REPEAT, 1)
export const announcerRate = useLocalStorage(STORAGE_KEY_RATE, RATE_DEFAULT)
export const announcerPitch = useLocalStorage(STORAGE_KEY_PITCH, PITCH_DEFAULT)
export const alertCrazyEnabled = useLocalStorage(STORAGE_KEY_ALERT_CRAZY, true)
export const alertClearEnabled = useLocalStorage(STORAGE_KEY_ALERT_CLEAR, true)
export const alertWelcomeEnabled = useLocalStorage(STORAGE_KEY_ALERT_WELCOME, true)
/** 임의 발화 프리셋 — 사용자가 popover 에서 추가/삭제/드래그 정렬. localStorage 단일 소스. */
export const announcerPresets = useLocalStorage<string[]>(STORAGE_KEY_PRESETS, [])

export function useOrderAnnouncer(orders: MaybeRefOrGetter<OrderExt[] | undefined>) {
  function announceCreated(order: OrderExt) {
    enqueueOrderAnnouncement(`${order.storeNm}, ${buildMenuText(order)}`)
  }

  function announceUpdated(order: OrderExt) {
    enqueueOrderAnnouncement(`주문 수정, ${order.storeNm}, ${buildMenuText(order)}`)
  }

  // 토글 전환 — ON 시 사용자 클릭(user gesture) 직후 첫 발화로 autoplay 정책 통과 확인 겸 확신,
  // OFF 시 큐 + 진행 중 TTS 즉시 정리.
  watch(announcerEnabled, (v) => {
    if (v) {
      enqueueAnnounce(() =>
        speakAsync('음성 알림 시작', { rate: announcerRate.value, pitch: announcerPitch.value }),
      )
    } else {
      clearAnnounceQueue()
    }
  })

  // ─── 임계치 알람 (READY 카운트 watch) ─────────────────────────────────
  const cReadyCount = computed(
    () => (toValue(orders) ?? []).filter((o) => o.status === 'READY').length,
  )

  let stopReadyWatch: WatchStopHandle | null = null

  function startReadyWatch() {
    if (stopReadyWatch) return
    stopReadyWatch = watch(cReadyCount, (newCnt, oldCnt) => {
      if (oldCnt === undefined) return // 초기 / 재진입 직후는 알림 X

      // 폭주: 9 이하 → 10 이상
      if (oldCnt < THRESHOLD_BUSY && newCnt >= THRESHOLD_BUSY) {
        enqueueAnnounce(async () => {
          if (!announcerEnabled.value || !alertCrazyEnabled.value) return
          await playAlert('CRAZY')
        })
      }

      // 전부 처리: 1 이상 → 0
      if (oldCnt > 0 && newCnt === 0) {
        enqueueAnnounce(async () => {
          if (!announcerEnabled.value || !alertClearEnabled.value) return
          await playAlert('CLEAR')
        })
      }

      // 첫 주문: 0 → 1 이상
      if (oldCnt === 0 && newCnt > 0) {
        enqueueAnnounce(async () => {
          if (!announcerEnabled.value || !alertWelcomeEnabled.value) return
          await playAlert('WELCOME')
        })
      }
    })
  }

  function stopReadyWatchFn() {
    stopReadyWatch?.()
    stopReadyWatch = null
  }

  // ─── Activation lifecycle ─────────────────────────────────────────────
  // OrdersMonitorPage 가 keepAlive — 활성 시에만 구독/watch 동작.
  // onActivated 가 첫 mount 시점에도 fire 되므로 setup 단계 호출 불필요.

  let offCreated: (() => void) | null = null
  let offUpdated: (() => void) | null = null

  onActivated(() => {
    if (!offCreated) offCreated = orderCreatedBus.on(announceCreated)
    if (!offUpdated) offUpdated = orderUpdatedBus.on(announceUpdated)
    startReadyWatch()
  })

  onDeactivated(() => {
    offCreated?.()
    offUpdated?.()
    offCreated = null
    offUpdated = null
    stopReadyWatchFn()
    clearAnnounceQueue()
  })

  return {
    enabled: announcerEnabled,
    repeatCount: announcerRepeat,
    rate: announcerRate,
    pitch: announcerPitch,
    alertCrazy: alertCrazyEnabled,
    alertClear: alertClearEnabled,
    alertWelcome: alertWelcomeEnabled,
    REPEAT_MIN,
    REPEAT_MAX,
    RATE_MIN,
    RATE_MAX,
    RATE_STEP,
    PITCH_MIN,
    PITCH_MAX,
    PITCH_STEP,
    THRESHOLD_BUSY,
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function buildMenuText(order: OrderExt) {
  return order.menus.map((m) => m.menuNm + m.cnt + '개').join(', ')
}

/** Door Bell + TTS(반복 N회) 1개 task 로 enqueue. 진행 도중 OFF 되면 즉시 중단. */
function enqueueOrderAnnouncement(text: string) {
  if (!announcerEnabled.value) return
  enqueueAnnounce(async () => {
    if (!announcerEnabled.value) return
    playAlert('BELL')
    await promiseTimeout(1000)

    const times = clamp(announcerRepeat.value, REPEAT_MIN, REPEAT_MAX)
    for (let i = 0; i < times; i++) {
      if (!announcerEnabled.value) break
      await speakAsync(text, { rate: announcerRate.value, pitch: announcerPitch.value })
    }
  })
}

/**
 * 임의 텍스트 발화 — 사용자 능동 조작이라 master `enabled` 무관.
 * 큐 enqueue 로 다른 발화와 직렬화. rate 만 적용 (repeat 미적용 — 1회).
 */
export function announceCustom(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return

  enqueueAnnounce(async () => {
    const times = clamp(announcerRepeat.value, REPEAT_MIN, REPEAT_MAX)
    for (let i = 0; i < times; i++) {
      await speakAsync(trimmed, { rate: announcerRate.value, pitch: announcerPitch.value })
    }
  })
}
