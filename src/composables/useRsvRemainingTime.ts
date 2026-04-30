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
    return { minutes, label: formatRemainingLabel(minutes), status }
  })
}

/**
 * 남은 분 → 한글 라벨. 단일 단위로 단순화 (분 / 시간 / 일).
 *   1분 후 / 30분 후 / 1시간 후 / 5시간 후 / 1일 후 / 3일 후
 *   1분 전 / 2시간 전 / 1일 전
 *   0분이면 "지금".
 */
function formatRemainingLabel(minutes: number): string {
  if (minutes === 0) return '지금'
  const abs = Math.abs(minutes)
  const suffix = minutes > 0 ? '후' : '전'

  if (abs < 60) return `${abs}분 ${suffix}`
  if (abs < 60 * 24) return `${Math.floor(abs / 60)}시간 ${suffix}`
  return `${Math.floor(abs / (60 * 24))}일 ${suffix}`
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
