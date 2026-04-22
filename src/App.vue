<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>

<template>
  <RouterView />
  <Toast position="top-right" />
  <ConfirmDialog />
  <VueQueryDevtools />
</template>

<style scoped></style>
