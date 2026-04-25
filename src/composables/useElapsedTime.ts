import { useNow } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export type ElapsedStatus = 'fresh' | 'caution' | 'warning' | 'danger'

export interface ElapsedTime {
  minutes: number
  label: string
  status: ElapsedStatus
}

/**
 * 주문 시각 대비 경과시간을 1분 단위로 계산.
 * 임계치는 theme.css 의 --color-status-* 토큰 기준 (caution 15+, warning 25+, danger 35+).
 */
export function useElapsedTime(orderAt: MaybeRefOrGetter<string>) {
  const now = useNow({ interval: 60_000 })

  return computed<ElapsedTime>(() => {
    const diffMs = now.value.getTime() - new Date(toValue(orderAt)).getTime()
    const minutes = Math.max(0, Math.floor(diffMs / 60_000))
    const status: ElapsedStatus =
      minutes >= 35 ? 'danger' : minutes >= 25 ? 'warning' : minutes >= 15 ? 'caution' : 'fresh'
    return {
      minutes,
      label: minutes < 1 ? '방금' : `${minutes}분 경과`,
      status,
    }
  })
}

/** 경과 상태별 카드 border / 시간row 배경 (배지 색상은 OrderElapsedBadge가 소유). */
export const STATUS_CLASSES: Record<ElapsedStatus, { border: string; timeRowBg: string }> = {
  fresh: { border: 'border-blue-500', timeRowBg: 'bg-blue-50' },
  caution: { border: 'border-status-caution', timeRowBg: 'bg-amber-50' },
  warning: { border: 'border-status-warning', timeRowBg: 'bg-orange-50' },
  danger: { border: 'border-status-danger', timeRowBg: 'bg-red-50' },
}
