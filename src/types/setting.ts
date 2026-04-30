/**
 * 시스템 설정 코드 — backend SettingCode enum 과 1:1 매칭.
 * 새 코드 추가 시:
 *   1. 이 union 에 추가
 *   2. {@link ConfigByCode} 에 config shape 매핑 추가
 *   3. 백엔드 enum + m_setting seed row 와 함께 갱신
 */
export type SettingCode =
  | 'STORE_ORDER'
  | 'MENU_ORDER'
  | 'STORE_CATEGORY_ORDER'
  | 'MENU_CATEGORY_ORDER'

/**
 * 정렬 setting config — `{ order: [seq, ...] }`.
 * 누락된 항목은 백엔드/UI 가 끝에 append (신규 추가 row 자동 표시 보장).
 */
export interface OrderConfig {
  order: number[]
}

/**
 * SettingCode → config shape 매핑.
 * 코드 별로 effectiveConfig / userConfig / defaultConfig 의 shape 가 결정됨.
 */
export type ConfigByCode = {
  STORE_ORDER: OrderConfig
  MENU_ORDER: OrderConfig
  STORE_CATEGORY_ORDER: OrderConfig
  MENU_CATEGORY_ORDER: OrderConfig
}

/**
 * 설정 단건 — ConfigByCode 매핑으로 code 별 typed.
 * - userConfig: 사용자 override. null 이면 default 사용.
 * - effectiveConfig: userConfig ?? defaultConfig. UI 에서 일반적으로 이 값 사용.
 *
 * @example
 *   const setting: Setting<'STORE_ORDER'> = ...
 *   setting.effectiveConfig.order  // number[]
 */
export interface Setting<C extends SettingCode = SettingCode> {
  code: C
  defaultConfig: ConfigByCode[C]
  userConfig: ConfigByCode[C] | null
  effectiveConfig: ConfigByCode[C]
  modAt: string
}
