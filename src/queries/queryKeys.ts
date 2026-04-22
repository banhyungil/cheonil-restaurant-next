/**
 * TanStack Query 의 queryKey 를 한 곳에 관리.
 * invalidate / refetch 시 동일 key 참조가 필요하므로 중앙화.
 */
export const QUERY_KEYS = {
  menus: ['menus'] as const,
  menuCtgs: ['menuCtgs'] as const,
  stores: ['stores'] as const,
  storeCtgs: ['storeCtgs'] as const,
} as const
