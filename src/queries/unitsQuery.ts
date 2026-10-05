import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import * as unitsApi from '@/apis/unitsApi'
import type { UnitSavePayload } from '@/apis/unitsApi'

import { QUERY_KEYS } from './queryKeys'

/** 단위 전체 조회 쿼리. */
export function useUnitsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.units,
    queryFn: unitsApi.fetchList,
  })
}

/** 단위 생성. 실패 시 글로벌 토스트 (중복 이름 등 backend 메시지 노출). */
export function useUnitCreateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UnitSavePayload) => unitsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.units }),
  })
}

/** 단위 전체 수정 (PUT 교체). */
export function useUnitUpdateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ seq, payload }: { seq: number; payload: UnitSavePayload }) =>
      unitsApi.update(seq, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.units }),
  })
}

/** 단위 삭제. */
export function useUnitRemoveMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (seq: number) => unitsApi.remove(seq),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.units }),
  })
}
