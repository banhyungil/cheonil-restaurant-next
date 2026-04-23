<!-- 주문 -->
<template>
  <div class="orders-page flex h-full gap-6 bg-surface-50 px-8 py-6">
    <!-- Left: 매장 미선택 → StoreGrid, 선택됨 → MenuGrid
         v-show 로 둘 다 마운트 유지 → 매장 재선택 시 MenuGrid 내부 filter/search state 보존 -->
    <StoreGrid
      v-show="selStore == null"
      :stores="stores ?? []"
      :categories="storeCategories ?? []"
      :active="selStore == null"
      class="flex-1"
      @select="onSelectStore"
    />
    <MenuGrid
      v-show="selStore != null"
      :menus="menus ?? []"
      :categories="menuCategories ?? []"
      :active="selStore != null"
      class="flex-1"
      @add="onAddMenu"
    />

    <!-- Right: 카트 패널 (상태별 자동 분기) -->
    <OrderCartPanel
      v-model:memo="memo"
      :store="selStore"
      :items="cart"
      @increment="onIncrement"
      @decrement="onDecrement"
      @change-store="onChangeStore"
      @reset="onResetAll"
      @checkout="onCheckout"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { useMenuCtgsQuery } from '@/queries/menuCtgsQuery'
import { useMenusQuery } from '@/queries/menusQuery'
import { useStoreCtgsQuery } from '@/queries/storeCtgsQuery'
import { useStoresQuery } from '@/queries/storesQuery'
import type { CartItem } from '@/types/cart'
import type { Store } from '@/types/store'

// 서버 데이터 — vue-query 가 캐싱·재검증·dedup 자동 처리
const { data: menus } = useMenusQuery()
const { data: menuCategories } = useMenuCtgsQuery()
const { data: stores } = useStoresQuery()
const { data: storeCategories } = useStoreCtgsQuery()

// 주문 작성 상태
const selStore = ref<Store | null>(null)
const cart = ref<CartItem[]>([])
const memo = ref('')

function onSelectStore(storeSeq: number) {
  const store = stores.value?.find((s) => s.seq === storeSeq)
  if (!store) return
  selStore.value = store
}

function onChangeStore() {
  // 매장만 다시 고르는 모드 — cart·memo 유지
  selStore.value = null
}

function onAddMenu(menuSeq: number) {
  const existing = cart.value.find((i) => i.menuSeq === menuSeq)
  if (existing) {
    existing.cnt++
    return
  }
  const menu = menus.value?.find((m) => m.seq === menuSeq)
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

function onResetAll() {
  selStore.value = null
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
