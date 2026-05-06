import type { ConfigByCode, SettingCode, SettingRaw } from '@/types/setting'

import { api } from './api'

/**
 * 설정 갱신 페이로드 — code 별 config shape 검증.
 */
export interface SettingUpdatePayload<C extends SettingCode> {
  userConfig: ConfigByCode[C]
}

/**
 * apis/ 는 wire format (SettingRaw — `config` 필드 없음) 만 반환.
 * 도메인 모델 (`Setting` with `config`) 로의 lift 는 queries/settingsQuery 책임.
 */

/** 전체 설정 목록 조회 — union 반환, 호출부에서 code 로 narrowing. */
export async function fetchList(): Promise<SettingRaw[]> {
  return api.get<SettingRaw[]>('/settings').then((r) => r.data)
}

/** 단건 조회 — generic code 로 정확한 config shape 추론. */
export async function fetchByCode<C extends SettingCode>(code: C): Promise<SettingRaw<C>> {
  return api.get<SettingRaw<C>>(`/settings/${code}`).then((r) => r.data)
}

/** userConfig 갱신. payload 의 userConfig shape 가 code 에 따라 검증됨. */
export async function update<C extends SettingCode>(
  code: C,
  payload: SettingUpdatePayload<C>,
): Promise<SettingRaw<C>> {
  return api.put<SettingRaw<C>>(`/settings/${code}`, payload).then((r) => r.data)
}

/** userConfig 를 NULL 로 → default 복원. */
export async function restore<C extends SettingCode>(code: C): Promise<SettingRaw<C>> {
  return api.post<SettingRaw<C>>(`/settings/${code}/restore`).then((r) => r.data)
}
