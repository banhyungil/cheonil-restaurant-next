import { api } from './api'

/**
 * Spring Data `Page<T>` 의 클라이언트 매핑 — 운영자 페이지 페이지네이션용.
 * 필요한 필드만 노출 (pageable/sort 등 보조 필드는 생략).
 */
export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface VoiceOrderLogRes {
  seq: number
  orderSeq: number | null
  /** 최종 성공 엔진 — 'WHISPER' / 'GOOGLE'. 양쪽 실패 시 null. */
  engineUsed: 'WHISPER' | 'GOOGLE' | null
  whisperText: string | null
  googleText: string | null
  finalText: string | null
  errorMessage: string | null
  audioMime: string
  audioSizeBytes: number
  /** ISO-8601. */
  createdAt: string
}

/** 운영자 페이지 — 최근순 페이지네이션. */
export async function fetchVoiceOrderLogs(params: {
  page?: number
  size?: number
}): Promise<SpringPage<VoiceOrderLogRes>> {
  return api
    .get<SpringPage<VoiceOrderLogRes>>('/voice-order-logs', {
      params: { page: params.page ?? 0, size: params.size ?? 20 },
    })
    .then((r) => r.data)
}

/** `<audio :src>` 에 바로 바인딩할 audio URL. */
export function voiceOrderLogAudioUrl(seq: number): string {
  return `/api/voice-order-logs/${seq}/audio`
}
