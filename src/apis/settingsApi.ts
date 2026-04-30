import type { ConfigByCode, Setting, SettingCode } from '@/types/setting'

import { api } from './api'

/**
 * 설정 갱신 페이로드 — code 별 config shape 검증.
 */
export interface SettingUpdatePayload<C extends SettingCode> {
  userConfig: ConfigByCode[C]
}

/** 전체 설정 목록 조회 — union 반환, 호출부에서 code 로 narrowing. */
export async function fetchList(): Promise<Setting[]> {
  return api.get<Setting[]>('/settings').then((r) => r.data)
}

/** 단건 조회 — generic code 로 정확한 config shape 추론. */
export async function fetchByCode<C extends SettingCode>(code: C): Promise<Setting<C>> {
  return api.get<Setting<C>>(`/settings/${code}`).then((r) => r.data)
}

/** userConfig 갱신. payload 의 userConfig shape 가 code 에 따라 검증됨. */
export async function update<C extends SettingCode>(
  code: C,
  payload: SettingUpdatePayload<C>,
): Promise<Setting<C>> {
  return api.put<Setting<C>>(`/settings/${code}`, payload).then((r) => r.data)
}

/** userConfig 를 NULL 로 → default 복원. */
export async function restore<C extends SettingCode>(code: C): Promise<Setting<C>> {
  return api.post<Setting<C>>(`/settings/${code}/restore`).then((r) => r.data)
}
