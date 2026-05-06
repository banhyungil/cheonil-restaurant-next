import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import * as settingsApi from '@/apis/settingsApi'

import type { ConfigByCode, Setting, SettingCode, SettingRaw } from '@/types/setting'

import { QUERY_KEYS } from './queryKeys'

/**
 * Wire format → 도메인 모델 lift.
 * `config = userConfig ?? defaultConfig` derive 추가 — 사용처는 `s.config.X` 로 단순 접근.
 */
function withConfig<C extends SettingCode>(s: SettingRaw<C>): Setting<C> {
  return { ...s, config: s.userConfig ?? s.defaultConfig }
}

/** 전체 설정 목록 — 앱 진입 시 1회 조회 / 정렬 변경 후 invalidate. */
export function useSettingsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: async () => (await settingsApi.fetchList()).map((s) => withConfig(s)),
  })
}

/** 단건 조회 — generic code 로 정확한 config shape 추론. */
export function useSettingQuery<C extends SettingCode>(code: MaybeRefOrGetter<C>) {
  return useQuery({
    queryKey: computed<string[]>(() => [...QUERY_KEYS.settings, toValue(code)]),
    queryFn: async () => withConfig(await settingsApi.fetchByCode(toValue(code))),
  })
}

/**
 * userConfig 갱신 — 정렬 드래그 종료 시 호출.
 * 호출 시 generic 명시: `useSettingUpdateMutation<'STORE_ORDER'>()`
 */
export function useSettingUpdateMutation<C extends SettingCode>() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { code: C; userConfig: ConfigByCode[C] }) =>
      settingsApi.update(args.code, { userConfig: args.userConfig }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.settings }),
  })
}

/** userConfig NULL 복원 — "기본 순서로 되돌리기" 액션. */
export function useSettingRestoreMutation<C extends SettingCode>() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: C) => settingsApi.restore(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.settings }),
  })
}
