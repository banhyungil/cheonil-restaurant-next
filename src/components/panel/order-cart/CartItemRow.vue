<template>
  <div
    class="cart-item-row flex h-19 items-center gap-3 rounded-[10px] border border-surface-200 bg-surface-0 px-4 py-3.5"
  >
    <div class="flex w-50 flex-col gap-0.5">
      <span class="text-base font-semibold text-surface-900">{{ item.nm }}</span>
      <span class="text-sm text-surface-500">{{ formatWon(item.price) }}</span>
    </div>
    <BButton
      variant="outlined"
      color="secondary"
      size="sm"
      aria-label="수량 감소"
      @click="emit('decrement', item.menuSeq)"
    >
      <Minus :size="14" />
    </BButton>
    <div
      class="flex h-8.5 w-11 items-center justify-center rounded-md border-[1.5px] border-primary-500 bg-primary-50 text-base font-bold text-primary-700"
    >
      {{ item.cnt }}
    </div>
    <BButton
      color="primary"
      size="sm"
      aria-label="수량 증가"
      @click="emit('increment', item.menuSeq)"
    >
      <Plus :size="14" />
    </BButton>
    <div class="ml-auto flex h-8.5 w-17.5 items-center justify-end">
      <span class="text-base font-semibold text-surface-900">
        {{ cSubTotal.toLocaleString('ko-KR') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'
import { computed } from 'vue'

import type { CartItem } from '@/types/cart'
import { formatWon } from '@/utils/formatters'

const props = defineProps<{
  item: CartItem
}>()

const emit = defineEmits<{
  increment: [menuSeq: number]
  decrement: [menuSeq: number]
}>()

const cSubTotal = computed(() => props.item.price * props.item.cnt)
</script>
