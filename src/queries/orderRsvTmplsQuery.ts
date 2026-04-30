import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import * as orderRsvTmplsApi from '@/apis/orderRsvTmplsApi'
import type {
  RsvTmplCreatePayload,
  RsvTmplsListParams,
  RsvTmplUpdatePayload,
} from '@/apis/orderRsvTmplsApi'

import { QUERY_KEYS } from './queryKeys'

/**
 * 템플릿 목록 — 매장/요일/활성 필터.
 * 통계 카드 (전체/활성/비활성/오늘 자동 생성) 는 페이지에서 list 로 derive.
 * (별도 stats query 두지 않음 — generatedToday 만 백엔드 endpoint 추가 시 보강)
 */
export function useOrderRsvTmplsQuery(
  params?: MaybeRefOrGetter<RsvTmplsListParams | undefined>,
) {
  return useQuery({
    queryKey: computed(() => [...QUERY_KEYS.orderRsvTmpls, toValue(params) ?? {}] as const),
    queryFn: () => orderRsvTmplsApi.fetchList(toValue(params)),
  })
}

/** 템플릿 단건 조회 — 편집 페이지 hydrate 용 (목록 데이터로 충분하면 호출 불필요). */
export function useOrderRsvTmplQuery(seq: MaybeRefOrGetter<number | null>) {
  return useQuery({
    queryKey: computed(() => [...QUERY_KEYS.orderRsvTmpls, toValue(seq)] as const),
    queryFn: () => orderRsvTmplsApi.fetchById(toValue(seq)!),
    enabled: computed(() => toValue(seq) != null),
  })
}

/** 템플릿 생성. */
export function useOrderRsvTmplCreateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: RsvTmplCreatePayload) => orderRsvTmplsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.orderRsvTmpls }),
  })
}

/** 템플릿 전체 수정 (PUT 교체). */
export function useOrderRsvTmplUpdateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ seq, payload }: { seq: number; payload: RsvTmplUpdatePayload }) =>
      orderRsvTmplsApi.update(seq, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.orderRsvTmpls }),
  })
}

/** 템플릿 활성 토글 — 목록 행의 ON/OFF 스위치. */
export function useOrderRsvTmplActiveMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ seq, active }: { seq: number; active: boolean }) =>
      orderRsvTmplsApi.patchActive(seq, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.orderRsvTmpls }),
  })
}

/** 템플릿 삭제 — 연결된 인스턴스는 백엔드가 rsv_tmpl_seq=NULL 처리. */
export function useOrderRsvTmplRemoveMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (seq: number) => orderRsvTmplsApi.remove(seq),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.orderRsvTmpls }),
  })
}
