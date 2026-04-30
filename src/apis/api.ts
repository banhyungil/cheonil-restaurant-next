import axios, { type AxiosError } from 'axios'
import qs from 'qs'

import type { ApiErrorResponse } from '@/types/api'
import { getToast } from '@/utils/toastBus'

/**
 * axios config 확장 — 요청별 silent 옵션.
 * 호출부에서 `{ silent: true }` 로 인터셉터의 자동 토스트 skip → 페이지 onError 에서 직접 처리.
 */
declare module 'axios' {
  export interface AxiosRequestConfig {
    /** true 면 인터셉터의 자동 에러 토스트 skip. */
    silent?: boolean
  }
}

/**
 * 1. jwt 토큰 관리
 * 2. 공통 에러 처리 — backend GlobalExceptionHandler 의 ApiErrorResponse 매핑 + 자동 토스트
 * 3. query string 직렬화 — 배열은 콤마 join (Spring 의 List 바인딩 친화적)
 *    예: { statuses: ['READY','COOKED'] } → ?statuses=READY,COOKED
 */

/** singleton api 인스턴스 */
export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    serialize: (params) => qs.stringify(params, { arrayFormat: 'comma', skipNulls: true }),
  },
})

// 요청 인터셉터 — 토큰 주입
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 응답 인터셉터 — 공통 에러 처리, 자동 토스트
// - 에러 타입 지정
// - status 에따른 분기처리. 현재는 권한과 아닌것만 구분
// - config를 통한 toast 발생 분기처리
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status
    const message = error.response?.data?.message ?? '잠시 후 다시 시도해주세요'

    if (status === 401) {
      // TODO 토큰 재발급 / 로그아웃 처리
    } else if (!error.config?.silent) {
      getToast()?.add({ severity: 'error', summary: '오류', detail: message, life: 3000 })
    }
    return Promise.reject(error)
  },
)

/**
 * 에러 객체에서 backend message 추출.
 * silent 호출 시 페이지 onError 에서 토스트 detail 로 사용.
 *
 * @example
 *   onError: (e) => toast.add({ severity: 'error', summary: '예약 등록 실패', detail: getErrorMessage(e) })
 */
export function getErrorMessage(error: unknown, fallback = '잠시 후 다시 시도해주세요'): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? fallback
  }
  return fallback
}
