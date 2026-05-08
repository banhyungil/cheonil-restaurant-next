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
  | 'OPERATING_HOURS'
  | 'RSV_SCHEDULER'

/**
 * 정렬 setting config — `{ order: [seq, ...] }`.
 * 누락된 항목은 백엔드/UI 가 끝에 append (신규 추가 row 자동 표시 보장).
 */
export interface OrderConfig {
  order: number[]
}

/**
 * 운영 시간 — 우리 가게의 영업 시작/종료 시각 (시 단위).
 * 영업 시간 외 주문 차단 / 통계 시간대 bucket 결정 등에 영향.
 */
export interface OperatingHoursConfig {
  /** 시작 시각 (0~23). */
  startHour: number
  /** 종료 시각 (0~23). startHour 보다 커야 함. */
  endHour: number
}

/**
 * 예약 스케줄러 — 템플릿 → 인스턴스 자동 생성 동작 파라미터.
 */
export interface RsvSchedulerConfig {
  /** 트리거 시점 기준 — 예약 시각이 얼마나 미래인지 (분). cron 주기(10분) 이상 권장. */
  leadMinutes: number
}

/**
 * SettingCode → config shape 매핑.
 * 코드 별로 config / userConfig / defaultConfig 의 shape 가 결정됨.
 */
export type ConfigByCode = {
  STORE_ORDER: OrderConfig
  MENU_ORDER: OrderConfig
  STORE_CATEGORY_ORDER: OrderConfig
  MENU_CATEGORY_ORDER: OrderConfig
  OPERATING_HOURS: OperatingHoursConfig
  RSV_SCHEDULER: RsvSchedulerConfig
}

/**
 * 설정 단건 — ConfigByCode 매핑으로 code 별 typed (도메인 모델).
 * - userConfig: 사용자 override. null 이면 default 사용.
 * - defaultConfig: 기본값 (기본값 표시 / 비교용).
 * - config: `userConfig ?? defaultConfig` — UI 가 실제 사용하는 값.
 *           queries 레이어에서 derive (백엔드 응답 = SettingRaw 에는 없음).
 *
 * @example
 *   const setting: Setting<'STORE_ORDER'> = ...
 *   setting.config.order  // number[]
 */
export interface Setting<C extends SettingCode = SettingCode> {
  code: C
  defaultConfig: ConfigByCode[C]
  userConfig: ConfigByCode[C] | null
  config: ConfigByCode[C]
  modAt: string
}

/**
 * 백엔드 wire format — `config` 가 없는 raw shape.
 * apis/settingsApi 가 반환, queries/settingsQuery 에서 `withConfig` 로 lift.
 */
export type SettingRaw<C extends SettingCode = SettingCode> = Omit<Setting<C>, 'config'>
