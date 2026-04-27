import _ from 'lodash'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { CartItem } from '@/types/cart'
import type { Menu } from '@/types/menu'
import type { OrderRsvExt } from '@/types/orderRsv'
import type { Store } from '@/types/store'

/**
 * 일회성 예약 작성/수정 draft 스토어.
 * - 신규 작성: editingSeq = null
 * - 기존 수정: editingSeq = 대상 예약 seq (메인 페이지 ⋮ → 수정에서 hydrate)
 *
 * orderCartStore 와 동일 패턴 + rsvAt(예약 일시) 추가.
 */
export const useOrderRsvCartStore = defineStore('orderRsvCart', () => {
  const selStore = ref<Store | null>(null)
  const cart = ref<CartItem[]>([])
  const memo = ref('')
  /** 예약 일시 ISO. 신규 진입 시 빈 문자열 → 페이지에서 기본값 (오늘+1시간) 채움. */
  const rsvAt = ref<string>('')
  const editingSeq = ref<number | null>(null)

  const isEditing = computed(() => editingSeq.value != null)
  const totalCount = computed(() => _.sumBy(cart.value, 'cnt'))
  const totalAmount = computed(() => _.sumBy(cart.value, (i) => i.price * i.cnt))

  /** 수정 모드 진입 — 메인 페이지 카드 ⋮ → 수정에서 호출. */
  function loadFromRsv(rsv: OrderRsvExt, store: Store) {
    selStore.value = store
    cart.value = rsv.menus.map((m) => ({
      menuSeq: m.menuSeq,
      nm: m.menuNm,
      price: m.price,
      cnt: m.cnt,
    }))
    memo.value = rsv.cmt ?? ''
    rsvAt.value = rsv.rsvAt
    editingSeq.value = rsv.seq
  }

  function setStore(store: Store) {
    selStore.value = store
  }

  /** 매장만 다시 고르는 모드 — cart·memo·rsvAt 유지. */
  function changeStore() {
    selStore.value = null
  }

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

  /** 전체 초기화 — 저장/취소 후 호출. */
  function reset() {
    selStore.value = null
    cart.value = []
    memo.value = ''
    rsvAt.value = ''
    editingSeq.value = null
  }

  return {
    selStore,
    cart,
    memo,
    rsvAt,
    editingSeq,
    isEditing,
    totalCount,
    totalAmount,
    loadFromRsv,
    setStore,
    changeStore,
    addItem,
    increment,
    decrement,
    setCnt,
    reset,
  }
})
