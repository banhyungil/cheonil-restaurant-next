<!-- 주문 -->
<template>
  <div class="orders-page flex h-full gap-6 bg-surface-50 px-8 py-6">
    <!-- Left: 메뉴 검색 + 카테고리 탭 + 카드 그리드 -->
    <section class="flex flex-1 flex-col gap-5">
      <!-- 메뉴 검색 -->
      <div
        class="flex h-14 w-60 items-center gap-2 rounded-lg border border-surface-200 bg-surface-0 px-3.5"
      >
        <Search :size="16" class="text-surface-500" />
        <input
          type="text"
          placeholder="메뉴 검색"
          class="flex-1 bg-transparent text-[13px] text-surface-900 placeholder:text-surface-500 focus:outline-none"
        />
      </div>

      <!-- 카테고리 탭 -->
      <div class="flex h-14 items-center gap-1 rounded-lg bg-surface-0 px-3 py-2">
        <button
          v-for="ctg in cMenuCategoriesAll"
          :key="ctg.seq"
          type="button"
          class="flex h-10 w-23 items-center justify-center rounded-lg text-[13px]"
          :class="
            selMenuCtg === ctg.seq
              ? 'bg-primary-500 font-semibold text-white'
              : 'border border-surface-200 bg-surface-0 font-medium text-surface-900'
          "
          @click="selMenuCtg = ctg.seq"
        >
          {{ ctg.nm }}
        </button>
      </div>

      <!-- 메뉴 그리드 -->
      <div class="grid grid-cols-5 gap-5">
        <button
          v-for="menu in cFilteredMenus"
          :key="menu.seq"
          type="button"
          class="flex h-[110px] flex-col items-center justify-center gap-1.5 rounded-[10px] px-3.5 py-4 transition-colors"
          :class="
            cSelMenuSeqs.includes(menu.seq)
              ? 'border-2 border-primary-500 bg-primary-50'
              : 'border border-surface-200 bg-surface-0 hover:border-primary-300'
          "
          @click="onAddMenu(menu.seq)"
        >
          <span class="text-lg font-semibold text-surface-900">{{ menu.nm }}</span>
          <span
            class="text-base font-medium"
            :class="cSelMenuSeqs.includes(menu.seq) ? 'text-primary-700' : 'text-surface-500'"
          >
            {{ formatWon(menu.price) }}
          </span>
        </button>
      </div>
    </section>

    <!-- Right: 카트 패널 -->
    <aside
      class="flex h-full w-[520px] shrink-0 flex-col gap-4 rounded-xl border border-surface-200 bg-surface-0 p-6"
    >
      <!-- 매장 헤더 -->
      <div class="flex h-12 items-center gap-3">
        <div
          class="flex h-12 flex-1 items-center justify-center gap-1 rounded-[10px] bg-primary-500"
        >
          <Store :size="16" class="text-white" />
          <span class="text-lg font-semibold text-white">{{ selStore.nm }}</span>
        </div>
        <button
          type="button"
          class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-surface-200 bg-surface-0 text-surface-500 hover:bg-surface-50"
          aria-label="매장 선택 초기화"
          @click="onResetCart"
        >
          <RotateCcw :size="16" />
        </button>
      </div>

      <div class="h-px w-full bg-surface-200" />

      <!-- 카트 아이템 리스트 -->
      <div class="flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
        <div
          v-for="item in cart"
          :key="item.menuSeq"
          class="flex h-[76px] items-center gap-3 rounded-[10px] border border-surface-200 bg-surface-0 px-4 py-3.5"
        >
          <div class="flex w-[200px] flex-col gap-0.5">
            <span class="text-base font-semibold text-surface-900">{{ item.nm }}</span>
            <span class="text-sm text-surface-500">{{ formatWon(item.price) }}</span>
          </div>
          <button
            type="button"
            class="flex size-[34px] items-center justify-center rounded-md border border-surface-300 bg-surface-0 text-lg font-semibold text-surface-900 hover:bg-surface-50"
            aria-label="수량 감소"
            @click="onDecrement(item.menuSeq)"
          >
            −
          </button>
          <div
            class="flex h-[34px] w-11 items-center justify-center rounded-md border-[1.5px] border-primary-500 bg-primary-50 text-base font-bold text-primary-700"
          >
            {{ item.cnt }}
          </div>
          <button
            type="button"
            class="flex size-[34px] items-center justify-center rounded-md bg-primary-500 text-lg font-semibold text-white hover:bg-primary-600"
            aria-label="수량 증가"
            @click="onIncrement(item.menuSeq)"
          >
            +
          </button>
          <div class="ml-auto flex h-[34px] w-[70px] items-center justify-end">
            <span class="text-base font-semibold text-surface-900">
              {{ (item.price * item.cnt).toLocaleString('ko-KR') }}
            </span>
          </div>
        </div>
      </div>

      <div class="h-px w-full bg-surface-200" />

      <!-- 비고 (메모) -->
      <div class="flex flex-col gap-1.5">
        <label for="order-memo" class="text-sm font-semibold text-surface-900">비고</label>
        <textarea
          id="order-memo"
          v-model="memo"
          rows="3"
          placeholder="덜맵게, 포장 여부 등 요청사항…"
          class="h-20 resize-none rounded-md border border-surface-300 bg-surface-0 px-3 py-2.5 text-sm text-surface-900 placeholder:text-surface-500 focus:border-primary-500 focus:outline-none"
        />
      </div>

      <!-- 총 금액 -->
      <div class="flex h-9 items-center justify-between">
        <span class="text-base font-medium text-surface-500">
          총 금액 ({{ cTotalCount }}건)
        </span>
        <span class="text-2xl font-bold text-surface-900">{{ formatWon(cTotalAmount) }}</span>
      </div>

      <!-- CTA -->
      <button
        type="button"
        class="flex h-[60px] items-center justify-center rounded-[10px] bg-primary-500 text-lg font-bold text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-surface-300"
        :disabled="cart.length === 0"
        @click="onCheckout"
      >
        주문완료
      </button>
    </aside>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { RotateCcw, Search, Store } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { DUMMY_MENU_CATEGORIES, DUMMY_MENUS } from '@/data/dummy/menus'
import { DUMMY_STORES } from '@/data/dummy/stores'
import type { CartItem } from '@/types/cart'

const ALL_CTG_SEQ = 0
const selMenuCtg = ref(ALL_CTG_SEQ)
const selStore = ref(DUMMY_STORES[0]!)
const cart = ref<CartItem[]>([
  { menuSeq: 1, nm: '돈까스', price: 8000, cnt: 1 },
  { menuSeq: 2, nm: '제육', price: 8000, cnt: 1 },
])
const memo = ref('')

const cMenuCategoriesAll = computed(() => [
  { seq: ALL_CTG_SEQ, nm: '전체' },
  ...DUMMY_MENU_CATEGORIES,
])

const cFilteredMenus = computed(() =>
  selMenuCtg.value === ALL_CTG_SEQ
    ? DUMMY_MENUS
    : DUMMY_MENUS.filter((m) => m.ctgSeq === selMenuCtg.value),
)

const cSelMenuSeqs = computed(() => cart.value.map((i) => i.menuSeq))
const cTotalCount = computed(() => _.sumBy(cart.value, 'cnt'))
const cTotalAmount = computed(() => _.sumBy(cart.value, (i) => i.price * i.cnt))

function formatWon(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

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
    totalAmount: cTotalAmount.value,
  })
}
</script>
