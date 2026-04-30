/**
 * 백엔드 GlobalExceptionHandler 의 표준 에러 응답.
 * 4xx / 5xx 응답 body 형태.
 */
export interface ApiErrorResponse {
  status: number
  message: string
  timestamp: string
}
