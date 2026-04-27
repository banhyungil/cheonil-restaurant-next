import _ from 'lodash'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { CartItem } from '@/types/cart'
import type { Menu } from '@/types/menu'
import type { DayType, OrderRsvTmplExt } from '@/types/orderRsv'
import type { Store } from '@/types/store'

/**
 * 예약 템플릿 작성/수정 draft 스토어.
 * - 신규 작성: editingSeq = null
 * - 기존 수정: editingSeq = 대상 템플릿 seq (목록 페이지 [편집] 에서 hydrate)
 *
 * orderRsvCartStore 와 동일 패턴 + 템플릿 전용 필드 (nm/dayTypes/rsvTime/startDt/endDt/active).
 */
export const useOrderRsvTmplStore = defineStore('orderRsvTmpl', () => {
  const selStore = ref<Store | null>(null)
  const cart = ref<CartItem[]>([])

  // 템플릿 메타
  const nm = ref('')
  const dayTypes = ref<DayType[]>([])
  /** 'HH:mm:ss'. */
  const rsvTime = ref<string>('')
  /** 'YYYY-MM-DD'. 필수 — 신규 진입 시 페이지에서 today 로 default 채움. */
  const startDt = ref<string>('')
  /** 'YYYY-MM-DD'. null = 무기한. */
  const endDt = ref<string | null>(null)
  const cmt = ref('')
  const active = ref(true)

  const editingSeq = ref<number | null>(null)

  const isEditing = computed(() => editingSeq.value != null)
  const totalCount = computed(() => _.sumBy(cart.value, 'cnt'))
  const totalAmount = computed(() => _.sumBy(cart.value, (i) => i.price * i.cnt))

  /** 수정 모드 진입 — 템플릿 목록 [편집] 에서 호출. */
  function loadFromTmpl(tmpl: OrderRsvTmplExt, store: Store) {
    selStore.value = store
    cart.value = tmpl.menus.map((m) => ({
      menuSeq: m.menuSeq,
      nm: m.menuNm,
      price: m.price,
      cnt: m.cnt,
    }))
    nm.value = tmpl.nm
    dayTypes.value = [...tmpl.dayTypes]
    rsvTime.value = tmpl.rsvTime
    startDt.value = tmpl.startDt
    endDt.value = tmpl.endDt ?? null
    cmt.value = tmpl.cmt ?? ''
    active.value = tmpl.active
    editingSeq.value = tmpl.seq
  }

  function setStore(store: Store) {
    selStore.value = store
  }

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

  function reset() {
    selStore.value = null
    cart.value = []
    nm.value = ''
    dayTypes.value = []
    rsvTime.value = ''
    startDt.value = ''
    endDt.value = null
    cmt.value = ''
    active.value = true
    editingSeq.value = null
  }

  return {
    selStore,
    cart,
    nm,
    dayTypes,
    rsvTime,
    startDt,
    endDt,
    cmt,
    active,
    editingSeq,
    isEditing,
    totalCount,
    totalAmount,
    loadFromTmpl,
    setStore,
    changeStore,
    addItem,
    increment,
    decrement,
    setCnt,
    reset,
  }
})
