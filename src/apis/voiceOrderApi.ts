import { api } from './api'

export interface VoiceOrderItem {
  menuSeq: number
  cnt: number
}

export interface VoiceOrderRes {
  storeSeq: number | null
  menus: VoiceOrderItem[]
  cmt: string | null
  /** LLM 이 매장/메뉴 사전에서 매칭 못한 발화 조각 (원문). 비어있어야 정상. */
  unmatched: string[]
  /** 디버깅용 — claude CLI 가 반환한 원본 JSON 텍스트. */
  raw: string
}

/**
 * 사용자 발화 텍스트 → 매장/메뉴 매칭된 주문 구조 데이터.
 *
 * 백엔드가 claude CLI 를 subprocess 로 호출하여 한국어 자연어를 분석.
 * 첫 호출은 ~3~10초 (claude CLI 초기화 + LLM 응답).
 */
export async function parseVoiceOrder(text: string): Promise<VoiceOrderRes> {
  return api
    .post<VoiceOrderRes>('/voice-order', { text }, { timeout: 60_000 })
    .then((r) => r.data)
}
