import axios from 'axios'
import qs from 'qs'

/**
 * 1. jwt 토큰 관리
 * 2. 공통 에러 처리
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
    serialize: (params) =>
      qs.stringify(params, { arrayFormat: 'comma', skipNulls: true }),
  },
})

// 요청 인터셉터 — 토큰 주입, 로깅
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 응답 인터셉터 — 공통 에러 처리, 토큰 갱신
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 재발급 or 로그아웃 처리
    }
    return Promise.reject(error)
  },
)
