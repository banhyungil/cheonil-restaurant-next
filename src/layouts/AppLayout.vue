<template>
  <div class="flex h-screen">
    <AppSidebar />
    <main class="flex-1 overflow-auto">
      <RouterView v-slot="{ Component }">
        <KeepAlive :include="cKeepAlivePages">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>
    <ShortcutsHelpDialog v-model:visible="showHelpDialog" />
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { RouterView } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
import ShortcutsHelpDialog from './components/ShortcutsHelpDialog.vue'

const route = useRoute()
const router = useRouter()
const showHelpDialog = ref(false)

/**
 * 사이드바 페이지 단축키 — Alt + 숫자.
 *
 * `e.code` 사용 이유: Alt+1 입력 시 Mac 의 `e.key` 는 layout 에 따라 `¡` 등 특수문자.
 * `Digit1` 처럼 물리키 기반이라 layout 무관 안정.
 */
const ALT_SHORTCUT_ROUTES: Record<string, string> = {
  Digit1: '/orders',
  Digit2: '/orders/monitor',
}

useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
  const target = ALT_SHORTCUT_ROUTES[e.code]
  if (!target) return
  e.preventDefault()
  if (route.path !== target) router.push(target)
})

// Ctrl+/ (or Cmd+/) — 단축키 도움말 토글.
useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return
  if (e.code !== 'Slash') return
  e.preventDefault()
  showHelpDialog.value = !showHelpDialog.value
})

/**
 * KeepAlive 정책:
 *  1. `KEEP_ALIVE_ALWAYS` 페이지 (주문/주문현황) — 라우트 무관 항상 보존
 *  2. `route.meta.keepAlive` 가 설정된 라우트 활성 시 — 해당 페이지 보존
 *     - 메인 페이지의 meta: 자기 자신 페이지명 → 진입부터 cache
 *     - edit 등 sub route: 부모 페이지명 → 메인이 살아있도록 보존
 *     - 메인/edit 둘 다 같은 값을 가리켜서 진입~edit 왕복까지 일관 cache
 *
 * 다른 그룹 페이지 (meta.keepAlive 없음) 이동 시 cache evict.
 *
 * 컴포넌트명은 SFC 파일명에서 자동 유추 (Vue 3 `<script setup>`).
 * 재진입 시 lifecycle 훅이 mount 대신 onActivated/onDeactivated 로 들어옴 — 영향받는 훅 사용 시 주의.
 */
const KEEP_ALIVE_ALWAYS = ['OrdersPage', 'OrdersMonitorPage']

const cKeepAlivePages = computed(() => {
  const k = route.meta.keepAlive
  return k ? [...KEEP_ALIVE_ALWAYS, k] : KEEP_ALIVE_ALWAYS
})
</script>
