import { promiseTimeout, useIntervalFn, useLocalStorage } from '@vueuse/core'
import { type MaybeRefOrGetter, onActivated, onDeactivated, toValue } from 'vue'

import {
  CAUTION_THRESHOLD_MIN,
  DANGER_THRESHOLD_MIN,
  RSV_LEAD_TIME_MIN,
  WARN_THRESHOLD_MIN,
} from '@/composables/useElapsedTime'
import {
  announcerEnabled,
  announcerGainDb,
  announcerRate,
  announcerVoice,
} from '@/composables/useOrderAnnouncer'
import type { OrderExt } from '@/types/order'
import { enqueueAnnounce, playAlert, speakSequence } from '@/utils/announceQueue'

/**
 * 주문 지연 알람 — READY 주문이 caution / warning / danger 단계 진입 시 1회씩 발화.
 *
 * 매분 폴링(`useIntervalFn`). 첫 폴링은 발화 X — 이미 단계 도달한 주문은 Map 에 등록만
 * (재진입/새로고침 시 무더기 발화 방지).
 *
 * 단계별 mp3 + TTS "<매장명>, <분>분 경과". 마스터 enabled / rate 는 useOrderAnnouncer 공유.
 *
 * `OrdersMonitorPage` keepAlive — `onActivated` / `onDeactivated` 로 lifecycle 제어.
 * 호출 위치: `useOrderAnnouncer` 내부에서 한 줄.
 */

const STORAGE_KEY_ALERT_WARNING = 'order-announcer-alert-warning'

/** 지연 알람 ON/OFF — popover 토글에서 직접 v-model 바인딩. */
export const alertWarningEnabled = useLocalStorage(STORAGE_KEY_ALERT_WARNING, true)

type Stage = 'caution' | 'warning' | 'danger'

/** 단계별 알림음 + 사운드 종료 후 TTS 까지 대기 시간. */
const O_STAGE_SOUNDS = {
  caution: { sound: 'ALAM_LV1', delay: 500 },
  warning: { sound: 'ALAM_LV2', delay: 1000 },
  danger: { sound: 'ALAM_LV3', delay: 1500 },
} as const

export function useOrderElapsedAlarm(orders: MaybeRefOrGetter<OrderExt[] | undefined>) {
  const orderAlarmedStage = new Map<number, Stage>()
  /** 최초 로드시 발화 방지 */
  let stageInitialized = false

  // 매분 폴링. immediate: false → setup 시 idle, onActivated 의 resume 으로 시작.
  // immediateCallback: true → resume 직후 1회 즉시 호출 → 첫 호출에서 초기 등록.
  const { pause, resume } = useIntervalFn(checkOrderElapsed, 60_000, {
    immediate: false,
    immediateCallback: true,
  })

  onActivated(async () => {
    /** 최초 로드시 발화 방지, orders 최초 로드 시간을 위해 2초 지연 */
    if (stageInitialized === false) await promiseTimeout(2000)
    resume()
  })
  onDeactivated(() => {
    pause()
    stageInitialized = false
    orderAlarmedStage.clear()
  })

  /** 매분 점검 — stage 산출 + transition 발화 + 빠진 주문 cleanup. */
  function checkOrderElapsed() {
    const list = toValue(orders) ?? []
    const nowMs = Date.now()
    const current = list
      .filter((o) => o.status === 'READY')
      .map((o) => {
        const baseMs = new Date(o.rsvAt ?? o.orderAt).getTime()
        const minutes = Math.floor((nowMs - baseMs) / 60_000)
        const urgency = o.rsvAt ? minutes + RSV_LEAD_TIME_MIN : minutes
        const stage: Stage | null =
          urgency >= DANGER_THRESHOLD_MIN
            ? 'danger'
            : urgency >= WARN_THRESHOLD_MIN
              ? 'warning'
              : urgency >= CAUTION_THRESHOLD_MIN
                ? 'caution'
                : null
        return { seq: o.seq, storeNm: o.storeNm, minutes, stage }
      })

    // 최초 로드시 무더기 발화 방지
    if (!stageInitialized) {
      for (const o of current) {
        if (o.stage) orderAlarmedStage.set(o.seq, o.stage)
      }
      stageInitialized = true
      return
    }

    for (const o of current) {
      if (!o.stage) continue
      const last = orderAlarmedStage.get(o.seq)
      const escalated =
        (o.stage === 'caution' && last === undefined) ||
        (o.stage === 'warning' && last !== 'warning') ||
        (o.stage === 'danger' && last !== 'danger')
      if (escalated) {
        orderAlarmedStage.set(o.seq, o.stage)
        // 매장명 / "N분 경과" 분할 — 매장명 1종 + 분 단위 6~8종 만 캐싱되면 거의 100% HIT.
        const minutesText = `${o.minutes}분 경과`
        const { sound, delay } = O_STAGE_SOUNDS[o.stage]
        enqueueAnnounce(async () => {
          if (!announcerEnabled.value || !alertWarningEnabled.value) return
          playAlert(sound)
          await promiseTimeout(delay)
          // 매장명 + "N분 경과" 모두 변동 없는 텍스트 → pinned 영구 캐시.
          await speakSequence(
            [
              { text: o.storeNm, tier: 'pinned' },
              { text: minutesText, tier: 'pinned' },
            ],
            {
              rate: announcerRate.value,
              gainDb: announcerGainDb.value,
              voice: announcerVoice.value,
            },
          )
        })
      }
    }

    // READY 에서 빠진 주문 cleanup. Map 순회 중 delete 는 ECMA 스펙상 안전.
    const currentSeqs = new Set(current.map((o) => o.seq))
    for (const seq of orderAlarmedStage.keys()) {
      if (!currentSeqs.has(seq)) orderAlarmedStage.delete(seq)
    }
  }
}
