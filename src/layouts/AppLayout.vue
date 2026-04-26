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
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
import { NAV_GROUPS } from '@/router/routes'

const route = useRoute()

/**
 * 자주 토글되는 페이지만 KeepAlive로 보존.
 * 컴포넌트명은 SFC 파일명에서 자동 유추 (Vue 3 `<script setup>`).
 * 재진입 시 lifecycle 훅이 mount 대신 onActivated/onDeactivated로 들어옴 — 영향받는 훅 사용 시 주의.
 */
const KEEP_ALIVE_PAGES = ['OrdersPage', 'OrdersMonitorPage']

/** 영업 외 페이지로 이동시에는 KeepAlive 중단 */
const cKeepAlivePages = computed(() => {
  if (route.meta.nav?.group == NAV_GROUPS.SALES) {
    return KEEP_ALIVE_PAGES
  } else {
    return []
  }
})
</script>
