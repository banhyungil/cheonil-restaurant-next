<!-- 마스터 관리 -->
<template>
  <section class="master-page flex h-full flex-col gap-5 px-8 py-6">
    <header class="flex h-10 items-center gap-3">
      <h1 class="text-2xl font-bold text-surface-900">{{ route.meta.nav?.label }}</h1>
    </header>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
