<template>
  <BButton
    tone="card"
    class="menu-card h-27.5 flex-col items-center justify-center gap-1.5 px-3.5 py-4"
    @click="emit('click', menu.seq)"
  >
    <span class="text-lg font-semibold text-surface-900">{{ menu.nm }}</span>
    <span class="text-base font-medium text-surface-500">{{ formatWon(menu.price) }}</span>
  </BButton>
</template>

<script setup lang="ts">
import type { Menu } from '@/types/menu'
import { formatWon } from '@/utils/formatters'

defineProps<{
  menu: Pick<Menu, 'seq' | 'nm' | 'price'>
}>()

const emit = defineEmits<{
  click: [menuSeq: number]
}>()
</script>
