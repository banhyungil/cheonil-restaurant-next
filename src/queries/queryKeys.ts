/**
 * TanStack Query 의 queryKey 를 한 곳에 관리.
 * invalidate / refetch 시 동일 key 참조가 필요하므로 중앙화.
 */
export const QUERY_KEYS = {
  menus: ['menus'] as const,
  menuCtgs: ['menuCtgs'] as const,
  stores: ['stores'] as const,
  storeCtgs: ['storeCtgs'] as const,
  orders: ['orders'] as const,
  // 계층 키(hierarchical key) 패턴
  // 상위 키('orders') invalidate 시 하위 모두 갱신 — 도메인 단위 일괄 refresh 용도
  ordersMonitor: ['orders', 'monitor'] as const,
} as const
