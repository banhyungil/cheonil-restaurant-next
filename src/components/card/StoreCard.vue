<template>
  <BButton
    variant="outlined"
    color="primary"
    class="store-card h-24! w-full! items-center justify-between px-5! py-3.5!"
    @click="emit('click', store.seq)"
  >
    <div>
      <span class="text-xl font-bold text-surface-900">{{ store.nm }}</span>
    </div>
    <div class="flex items-center gap-2">
      <VTooltip v-if="store.cmt" theme="cheonil-tooltip">
        <span
          class="flex size-5 cursor-help items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600"
          tabindex="0"
          @click.stop
        >
          i
        </span>
        <template #popper>
          <p class="whitespace-pre-wrap text-base text-surface-900">{{ store.cmt }}</p>
        </template>
      </VTooltip>
      <span
        v-if="categoryName"
        class="flex h-6 items-center rounded-xl bg-surface-100 px-2.5 text-sm font-semibold text-surface-700"
      >
        {{ categoryName }}
      </span>
    </div>
  </BButton>
</template>

<script setup lang="ts">
import type { Store } from '@/types/store'

defineProps<{
  store: Pick<Store, 'seq' | 'nm' | 'cmt'>
  /** 매장 카테고리명 — StoreGrid 에서 ctgSeq 로 lookup 해서 전달 */
  categoryName?: string
}>()

const emit = defineEmits<{
  click: [storeSeq: number]
}>()
</script>
