import type { OrderExt } from '@/types/order'

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

export interface VoiceOrderCreateRes {
  order: OrderExt
  transcribedText: string
  confirmation: string
  /** 실제로 성공한 STT 엔진 — "WHISPER" 또는 "GOOGLE". fallback 시 GOOGLE. */
  engine: 'WHISPER' | 'GOOGLE'
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

/**
 * 음성 → 주문 생성 (end-to-end).
 *
 * 서버 흐름: Whisper STT → claude parse → 검증 → (실패 시 Google STT 로 재시도) → 주문 생성.
 * 응답의 `engine` 으로 어느 엔진이 성공했는지 확인 가능.
 */
export async function createVoiceOrderFromAudio(audio: Blob): Promise<VoiceOrderCreateRes> {
  const formData = new FormData()
  formData.append('audio', audio, 'speech.webm')
  return api
    .post<VoiceOrderCreateRes>('/voice-order/create-order', formData, { timeout: 120_000 })
    .then((r) => r.data)
}
