<template>
  <aside
    class="order-cart-panel flex h-full w-130 shrink-0 flex-col gap-4 rounded-xl border border-surface-200 bg-surface-0 p-6"
  >
    <!-- 매장 헤더 -->
    <StoreSelectHeader :store-name="store.nm" @reset="emit('reset')" />

    <div class="h-px w-full bg-surface-200" />

    <!-- 카트 아이템 리스트 -->
    <div class="flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
      <CartItemRow
        v-for="item in items"
        :key="item.menuSeq"
        :item="item"
        @increment="(seq: number) => emit('increment', seq)"
        @decrement="(seq: number) => emit('decrement', seq)"
      />
    </div>

    <div class="h-px w-full bg-surface-200" />

    <!-- 비고 -->
    <div class="flex flex-col gap-1.5">
      <label for="order-memo" class="text-sm font-semibold text-surface-900">비고</label>
      <Textarea
        id="order-memo"
        :model-value="memo"
        rows="3"
        placeholder="덜맵게, 포장 여부 등 요청사항…"
        class="h-20 resize-none text-sm"
        @update:model-value="(v) => emit('update:memo', String(v ?? ''))"
      />
    </div>

    <!-- 총액 -->
    <CartSummary :total-count="cTotalCount" :total-amount="cTotalAmount" />

    <!-- CTA -->
    <BButton
      tone="primary"
      size="lg"
      :disabled="items.length === 0"
      @click="emit('checkout')"
    >
      주문완료
    </BButton>
  </aside>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { computed } from 'vue'

import type { CartItem } from '@/types/cart'
import type { Store } from '@/types/store'

const props = defineProps<{
  store: Pick<Store, 'seq' | 'nm'>
  items: CartItem[]
  memo: string
}>()

const emit = defineEmits<{
  'update:memo': [value: string]
  increment: [menuSeq: number]
  decrement: [menuSeq: number]
  reset: []
  checkout: []
}>()

const cTotalCount = computed(() => _.sumBy(props.items, 'cnt'))
const cTotalAmount = computed(() => _.sumBy(props.items, (i) => i.price * i.cnt))
</script>
