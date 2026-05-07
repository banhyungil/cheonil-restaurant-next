import { useLocalStorage } from '@vueuse/core'

/**
 * 사이드바 접힘 상태 — 레이아웃 전역 공유 (AppLayout / 페이지에서 카드 폭 조정 등).
 *
 * `useLocalStorage` 로 새로고침 후에도 유지. 모듈 레벨 ref 라 모든 호출자가 동일 인스턴스 참조.
 */
const collapsed = useLocalStorage('sidebar-collapsed', false)

export function useSidebarCollapsed() {
  return collapsed
}
