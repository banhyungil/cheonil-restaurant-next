<template>
  <BButton
    tone="card"
    class="store-card h-24 items-center justify-between px-5 py-3.5"
    @click="emit('click', store.seq)"
  >
    <span class="text-xl font-bold text-surface-900">{{ store.nm }}</span>
    <span
      v-if="categoryName"
      class="flex h-6 items-center rounded-xl bg-surface-100 px-2.5 text-sm font-semibold text-surface-700"
    >
      {{ categoryName }}
    </span>
  </BButton>
</template>

<script setup lang="ts">
import type { Store } from '@/types/store'

defineProps<{
  store: Pick<Store, 'seq' | 'nm'>
  /** 매장 카테고리명 — StoreGrid 에서 ctgSeq 로 lookup 해서 전달 */
  categoryName?: string
}>()

const emit = defineEmits<{
  click: [storeSeq: number]
}>()
</script>
