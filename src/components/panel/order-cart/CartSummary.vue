<template>
  <div class="cart-summary flex h-9 items-center justify-between">
    <span class="text-base font-medium text-surface-500">총 금액 ({{ totalCount }}건)</span>
    <span class="text-2xl font-bold text-surface-900">{{ formatWon(totalAmount) }}</span>
  </div>
</template>

<script setup lang="ts">
import { formatWon } from '@/utils/formatters'

defineProps<{
  totalCount: number
  totalAmount: number
}>()
</script>
