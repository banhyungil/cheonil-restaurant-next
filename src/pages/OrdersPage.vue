<!-- 주문 -->
<template>
  <div class="orders-page flex h-full gap-6 bg-surface-50 px-8 py-6">
    <!-- Left: 메뉴 검색 + 카테고리 탭 + 카드 그리드 -->
    <MenuGrid
      :menus="DUMMY_MENUS"
      :categories="DUMMY_MENU_CATEGORIES"
      class="flex-1"
      @add="onAddMenu"
    />

    <!-- Right: 카트 패널 -->
    <OrderCartPanel
      v-model:memo="memo"
      :store="selStore"
      :items="cart"
      @increment="onIncrement"
      @decrement="onDecrement"
      @reset="onResetCart"
      @checkout="onCheckout"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { DUMMY_MENU_CATEGORIES, DUMMY_MENUS } from '@/data/dummy/menus'
import { DUMMY_STORES } from '@/data/dummy/stores'
import type { CartItem } from '@/types/cart'

const selStore = ref(DUMMY_STORES[0]!)
const cart = ref<CartItem[]>([
  { menuSeq: 1, nm: '돈까스', price: 8000, cnt: 1 },
  { menuSeq: 2, nm: '제육', price: 8000, cnt: 1 },
])
const memo = ref('')

function onAddMenu(menuSeq: number) {
  const existing = cart.value.find((i) => i.menuSeq === menuSeq)
  if (existing) {
    existing.cnt++
    return
  }
  const menu = DUMMY_MENUS.find((m) => m.seq === menuSeq)
  if (!menu) return
  cart.value.push({ menuSeq: menu.seq, nm: menu.nm, price: menu.price, cnt: 1 })
}

function onIncrement(menuSeq: number) {
  const item = cart.value.find((i) => i.menuSeq === menuSeq)
  if (item) item.cnt++
}

function onDecrement(menuSeq: number) {
  const idx = cart.value.findIndex((i) => i.menuSeq === menuSeq)
  if (idx === -1) return
  cart.value[idx]!.cnt--
  if (cart.value[idx]!.cnt <= 0) cart.value.splice(idx, 1)
}

function onResetCart() {
  cart.value = []
  memo.value = ''
}

function onCheckout() {
  console.log('checkout', {
    store: selStore.value,
    cart: cart.value,
    memo: memo.value,
  })
}
</script>
