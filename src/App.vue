<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

import { useOrderStream } from '@/composables/useOrderStream'

// 주문 도메인 SSE 스트림 — 앱 lifetime 동안 유지, 캐시 자동 동기화
useOrderStream()
</script>

<template>
  <RouterView />
  <Toast position="top-right" />
  <ConfirmDialog />
  <VueQueryDevtools />
</template>

<style scoped></style>
