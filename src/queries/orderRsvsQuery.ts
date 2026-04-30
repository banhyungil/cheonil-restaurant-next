import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { subMinutes } from 'date-fns'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import * as orderRsvsApi from '@/apis/orderRsvsApi'
import type { RsvCreatePayload, RsvUpdatePayload } from '@/apis/orderRsvsApi'

import type { RsvStatus } from '@/types/orderRsv'

import { QUERY_KEYS } from './queryKeys'

/**
 * Mutation 정책
 * - ordersQuery 와 다르게 **mutation 의 onSuccess 에서 직접 invalidate** 한다.
 *   예약 도메인의 SSE 는 cron 자동 생성(`rsv:created`) 만 담당하므로,
 *   사용자 액션으로 발생하는 변경(create/update/status/remove) 은 SSE 가 아니라 mutation 이 캐시 갱신 책임을 진다.
 */

/** 처리 이력 윈도우 — 1시간 이내 처리분만 카드 표시 + 복구 가능. */
const HISTORY_WINDOW_MINUTES = 60

/**
 * 예약 메인 페이지용 쿼리 — RESERVED 전체 + 1시간 이내 COMPLETED/CANCELED.
 * select 에서 ready/history 로 분리해 페이지의 computed 부담을 줄임.
 * dayMode / storeSeq 변경 시 자동 refetch.
 */
export function useOrderRsvsMonitorQuery(
  dayMode: MaybeRefOrGetter<'TODAY' | 'ALL'>,
  storeSeq?: MaybeRefOrGetter<number | null>,
) {
  return useQuery({
    queryKey: computed(
      () => [...QUERY_KEYS.orderRsvsMonitor, toValue(dayMode), toValue(storeSeq) ?? null] as const,
    ),
    queryFn: () => {
      const seq = toValue(storeSeq)
      return orderRsvsApi.fetchList({
        dayMode: toValue(dayMode),
        ...(seq != null && { storeSeq: seq }),
      })
    },
    select: (list) => {
      const cutoff = subMinutes(new Date(), HISTORY_WINDOW_MINUTES).toISOString()
      return {
        ready: list.filter((r) => r.status === 'RESERVED'),
        history: list.filter(
          (r) =>
            (r.status === 'COMPLETED' || r.status === 'CANCELED') && r.modAt >= cutoff,
        ),
      }
    },
  })
}

/** 예약 생성 (일회성). */
export function useOrderRsvCreateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: RsvCreatePayload) => orderRsvsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.orderRsvs }),
  })
}

/** 예약 전체 수정 (PUT 교체). */
export function useOrderRsvUpdateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ seq, payload }: { seq: number; payload: RsvUpdatePayload }) =>
      orderRsvsApi.update(seq, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.orderRsvs }),
  })
}

/** 예약 상태 전이 (RESERVED↔COMPLETED↔CANCELED). 접수/취소/복구 모두 동일 mutation. */
export function useOrderRsvStatusMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ seq, status }: { seq: number; status: RsvStatus }) =>
      orderRsvsApi.updateStatus(seq, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.orderRsvs }),
  })
}

/** 예약 삭제. */
export function useOrderRsvRemoveMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (seq: number) => orderRsvsApi.remove(seq),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.orderRsvs }),
  })
}
