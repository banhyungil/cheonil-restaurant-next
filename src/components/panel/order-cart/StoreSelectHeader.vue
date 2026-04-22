<template>
  <div class="store-select-header flex h-12 items-center gap-3">
    <div
      class="flex h-12 flex-1 items-center justify-center gap-1 rounded-[10px] bg-primary-500"
    >
      <Store :size="16" class="text-white" />
      <span class="text-lg font-semibold text-white">{{ storeName }}</span>
    </div>
    <BButton
      tone="outlined"
      size="md"
      class="shrink-0 border-surface-200 text-surface-500"
      aria-label="매장 선택 초기화"
      @click="emit('reset')"
    >
      <RotateCcw :size="16" />
    </BButton>
  </div>
</template>

<script setup lang="ts">
import { RotateCcw, Store } from 'lucide-vue-next'

defineProps<{
  storeName: string
}>()

const emit = defineEmits<{
  reset: []
}>()
</script>
