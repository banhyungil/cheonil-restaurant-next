<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { useToast } from 'primevue/usetoast'

import { useOrderStream } from '@/composables/useOrderStream'
import { setToastInstance } from '@/utils/toastBus'

// 주문 도메인 SSE 스트림 — 앱 lifetime 동안 유지, 캐시 자동 동기화
useOrderStream()

// axios 인터셉터 등 setup 외부 컨텍스트에서도 토스트 호출 가능하도록 인스턴스 등록
setToastInstance(useToast())
</script>

<template>
  <RouterView />
  <Toast position="top-right" />
  <ConfirmDialog />
  <VueQueryDevtools />
</template>

<style scoped></style>
