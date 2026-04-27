import _ from 'lodash'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { CartItem } from '@/types/cart'
import type { Menu } from '@/types/menu'
import type { OrderExt } from '@/types/order'
import type { Store } from '@/types/store'

/**
 * 주문 작성 draft 스토어.
 * - 신규 주문 작성: editingSeq = null
 * - 기존 주문 수정: editingSeq = 대상 주문 seq (모니터의 ⋮ → 수정에서 hydrate)
 *
 * KeepAlive와 무관하게 페이지 간 상태 유지 — OrdersPage는 이 스토어를 직접 구독.
 */
export const useOrderCartStore = defineStore('orderCart', () => {
  const selStore = ref<Store | null>(null)
  const cart = ref<CartItem[]>([])
  const memo = ref('')
  const editingSeq = ref<number | null>(null)

  const isEditing = computed(() => editingSeq.value != null)
  const totalCount = computed(() => _.sumBy(cart.value, 'cnt'))
  const totalAmount = computed(() => _.sumBy(cart.value, (i) => i.price * i.cnt))

  /** 수정 모드로 진입 — 기존 주문 데이터로 hydrate. */
  function loadFromOrder(order: OrderExt, store: Store) {
    selStore.value = store
    cart.value = order.menus.map((m) => ({
      menuSeq: m.menuSeq,
      nm: m.menuNm,
      price: m.price,
      cnt: m.cnt,
    }))
    memo.value = order.cmt ?? ''
    editingSeq.value = order.seq
  }

  /** 신규 작성 시 매장 선택. */
  function setStore(store: Store) {
    selStore.value = store
  }

  /** 매장만 다시 고르는 모드 — cart·memo 유지. */
  function changeStore() {
    selStore.value = null
  }

  /** 카트에 메뉴 추가 (있으면 cnt++, 없으면 새로 추가). */
  function addItem(menu: Pick<Menu, 'seq' | 'nm' | 'price'>) {
    const existing = cart.value.find((i) => i.menuSeq === menu.seq)
    if (existing) {
      existing.cnt++
      return
    }
    cart.value.push({ menuSeq: menu.seq, nm: menu.nm, price: menu.price, cnt: 1 })
  }

  function increment(menuSeq: number) {
    const item = cart.value.find((i) => i.menuSeq === menuSeq)
    if (item) item.cnt++
  }

  function decrement(menuSeq: number) {
    const idx = cart.value.findIndex((i) => i.menuSeq === menuSeq)
    if (idx === -1) return
    cart.value[idx]!.cnt--
    if (cart.value[idx]!.cnt <= 0) cart.value.splice(idx, 1)
  }

  function setCnt(menuSeq: number, cnt: number) {
    const item = cart.value.find((i) => i.menuSeq === menuSeq)
    if (item) item.cnt = cnt
  }

  /** 전체 초기화 — 주문 완료/취소 후 호출. */
  function reset() {
    selStore.value = null
    cart.value = []
    memo.value = ''
    editingSeq.value = null
  }

  return {
    selStore,
    cart,
    memo,
    editingSeq,
    isEditing,
    totalCount,
    totalAmount,
    loadFromOrder,
    setStore,
    changeStore,
    addItem,
    increment,
    decrement,
    setCnt,
    reset,
  }
})
