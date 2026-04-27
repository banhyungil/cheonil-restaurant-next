import { useNow } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export type RemainingStatus = 'fresh' | 'warning' | 'danger'

export interface RemainingTime {
  /** 양수 = 남은 분, 음수 = 예약 시각 지남. */
  minutes: number
  /** "N분 후" / "N분 전" / "지금". */
  label: string
  status: RemainingStatus
}

/**
 * 예약 시각까지 남은 시간을 1분 단위로 계산.
 * 임계치 (피그마 디자인 기준): 30분↓ warning, 20분↓ danger. 그 외 fresh.
 * 음수(예약 시각 지남) 도 danger 로 묶어 카드 강조.
 */
export function useRsvRemainingTime(rsvAt: MaybeRefOrGetter<string>) {
  const now = useNow({ interval: 60_000 })

  return computed<RemainingTime>(() => {
    const diffMs = new Date(toValue(rsvAt)).getTime() - now.value.getTime()
    const minutes = Math.floor(diffMs / 60_000)
    const status: RemainingStatus =
      minutes <= 20 ? 'danger' : minutes <= 30 ? 'warning' : 'fresh'
    const label =
      minutes === 0 ? '지금' : minutes > 0 ? `${minutes}분 후` : `${-minutes}분 전`
    return { minutes, label, status }
  })
}

/** 카드 border / 배지 색상 매핑 (피그마: 여유=파랑 / 30분↓=주황 / 20분↓=빨강). */
export const REMAINING_STATUS_CLASSES: Record<
  RemainingStatus,
  { border: string; badgeBg: string; badgeText: string }
> = {
  fresh: {
    border: 'border-blue-500',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
  },
  warning: {
    border: 'border-orange-500',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
  },
  danger: {
    border: 'border-red-500',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
  },
}
