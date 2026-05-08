import { useNow } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export type ElapsedStatus = 'fresh' | 'caution' | 'warning' | 'danger'

export type ElapsedMode = 'order' | 'rsv'

export interface ElapsedTime {
  minutes: number
  label: string
  status: ElapsedStatus
}

/** 예약 카드의 lead time — 이 시간만큼 앞당겨 status 가 escalate (rsvAt 도래 시 danger). */
export const RSV_LEAD_TIME_MIN = 35

/** status escalate 임계치 (urgency 분 기준). */
export const CAUTION_THRESHOLD_MIN = 15
export const WARN_THRESHOLD_MIN = 25
export const DANGER_THRESHOLD_MIN = 35

/**
 * 기준 시각 대비 경과/잔여 시간을 1분 단위로 계산.
 *
 * - `mode === 'order'`: `baseAt` = 주문 시각. 일반 경과시간 ("X분 경과"/"방금"/"X분 후").
 * - `mode === 'rsv'`: `baseAt` = 예약 시각. 라벨은 "X분 후"/"도래"/"X분 지남".
 *   status 는 {@link RSV_LEAD_TIME_MIN} 만큼 앞당겨 계산 — 예약 도래 직전부터 자연스럽게 escalate
 *   (lead 35 기준: rsvAt 35분 전부터 fresh, 20분 전 caution, 10분 전 warning, 도래 시 danger).
 *
 * 임계치는 theme.css 의 --color-status-* 토큰 기준 (caution 15+, warning 25+, danger 35+).
 */
export function useElapsedTime(
  baseAt: MaybeRefOrGetter<string>,
  mode: MaybeRefOrGetter<ElapsedMode> = 'order',
) {
  const now = useNow({ interval: 60_000 })

  return computed<ElapsedTime>(() => {
    const diffMs = now.value.getTime() - new Date(toValue(baseAt)).getTime()
    const minutes = Math.floor(diffMs / 60_000)
    const m = toValue(mode)

    // status 계산용 — rsv 는 leadTime 만큼 앞당겨 escalate.
    const urgencyMinutes = m === 'rsv' ? minutes + RSV_LEAD_TIME_MIN : minutes
    const status: ElapsedStatus =
      urgencyMinutes >= DANGER_THRESHOLD_MIN
        ? 'danger'
        : urgencyMinutes >= WARN_THRESHOLD_MIN
          ? 'warning'
          : urgencyMinutes >= CAUTION_THRESHOLD_MIN
            ? 'caution'
            : 'fresh'

    let label: string
    if (m === 'rsv') {
      if (minutes < 0) label = `${-minutes}분 후`
      else if (minutes < 1) label = '도래'
      else label = `${minutes}분 지남`
    } else {
      if (minutes < 0) label = `${-minutes}분 후`
      else if (minutes < 1) label = '방금'
      else label = `${minutes}분 경과`
    }

    return { minutes, label, status }
  })
}

/** 경과 상태별 카드 border / 시간row 배경 (배지 색상은 OrderElapsedBadge가 소유). */
export const STATUS_CLASSES: Record<ElapsedStatus, { border: string; timeRowBg: string }> = {
  fresh: { border: 'border-blue-500', timeRowBg: 'bg-blue-50' },
  caution: { border: 'border-status-caution', timeRowBg: 'bg-amber-50' },
  warning: { border: 'border-status-warning', timeRowBg: 'bg-orange-50' },
  danger: { border: 'border-status-danger', timeRowBg: 'bg-red-50' },
}
