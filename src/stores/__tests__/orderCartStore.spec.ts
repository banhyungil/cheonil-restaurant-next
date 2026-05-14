import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useOrderCartStore } from '@/stores/orderCartStore'
import type { Menu } from '@/types/menu'
import type { OrderExt } from '@/types/order'
import type { Store } from '@/types/store'

// ---------- fixtures ----------

const aStore: Store = { seq: 10, ctgSeq: 1, nm: '본점' }

const menuKimchi: Pick<Menu, 'seq' | 'nm' | 'price'> = { seq: 101, nm: '김치찌개', price: 9000 }
const menuBibim: Pick<Menu, 'seq' | 'nm' | 'price'> = { seq: 102, nm: '비빔밥', price: 10000 }

function makeOrderExt(): OrderExt {
  return {
    seq: 7,
    storeSeq: 10,
    amount: 28000,
    status: 'READY',
    orderAt: '2026-05-15T10:00:00',
    cmt: '단무지 추가요',
    storeNm: '본점',
    menus: [
      { menuSeq: 101, orderSeq: 7, price: 9000, cnt: 2, menuNm: '김치찌개' },
      { menuSeq: 102, orderSeq: 7, price: 10000, cnt: 1, menuNm: '비빔밥' },
    ],
  }
}

// ---------- tests ----------

describe('orderCartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('초기 상태', () => {
    it('빈 카트 / 편집모드 아님 / 합계 0', () => {
      const s = useOrderCartStore()
      expect(s.cart).toEqual([])
      expect(s.memo).toBe('')
      expect(s.selStore).toBeNull()
      expect(s.editingSeq).toBeNull()
      expect(s.isEditing).toBe(false)
      expect(s.totalCount).toBe(0)
      expect(s.totalAmount).toBe(0)
    })
  })

  describe('addItem', () => {
    it('새 메뉴는 cnt=1로 추가', () => {
      const s = useOrderCartStore()
      s.addItem(menuKimchi)
      expect(s.cart).toHaveLength(1)
      expect(s.cart[0]).toMatchObject({ menuSeq: 101, nm: '김치찌개', price: 9000, cnt: 1 })
    })

    it('이미 있는 메뉴는 cnt만 증가 (중복 row 생성 X)', () => {
      const s = useOrderCartStore()
      s.addItem(menuKimchi)
      s.addItem(menuKimchi)
      s.addItem(menuKimchi)
      expect(s.cart).toHaveLength(1)
      expect(s.cart[0]!.cnt).toBe(3)
    })
  })

  describe('increment / decrement', () => {
    it('increment 은 해당 메뉴 cnt 만 +1', () => {
      const s = useOrderCartStore()
      s.addItem(menuKimchi)
      s.addItem(menuBibim)
      s.increment(101)
      expect(s.cart.find((i) => i.menuSeq === 101)!.cnt).toBe(2)
      expect(s.cart.find((i) => i.menuSeq === 102)!.cnt).toBe(1)
    })

    it('없는 menuSeq 로 increment 호출해도 에러 없음 (noop)', () => {
      const s = useOrderCartStore()
      expect(() => s.increment(999)).not.toThrow()
      expect(s.cart).toEqual([])
    })

    it('decrement 으로 cnt 가 0 이 되면 카트에서 제거', () => {
      const s = useOrderCartStore()
      s.addItem(menuKimchi)
      s.decrement(101)
      expect(s.cart).toHaveLength(0)
    })

    it('decrement 으로 cnt > 0 유지면 그대로 남음', () => {
      const s = useOrderCartStore()
      s.addItem(menuKimchi)
      s.addItem(menuKimchi) // cnt = 2
      s.decrement(101)
      expect(s.cart[0]!.cnt).toBe(1)
    })
  })

  describe('setCnt', () => {
    it('수량을 임의 값으로 설정', () => {
      const s = useOrderCartStore()
      s.addItem(menuKimchi)
      s.setCnt(101, 7)
      expect(s.cart[0]!.cnt).toBe(7)
    })
  })

  describe('합계 computed', () => {
    it('totalCount / totalAmount 는 cart 변경에 반응', () => {
      const s = useOrderCartStore()
      s.addItem(menuKimchi) // 9000 x1
      s.addItem(menuBibim) // 10000 x1
      s.increment(102) //         10000 x2
      expect(s.totalCount).toBe(3)
      expect(s.totalAmount).toBe(9000 + 10000 * 2)
    })
  })

  describe('loadFromOrder (수정 모드)', () => {
    it('주문 데이터로 hydrate 하고 editing 상태로 전환', () => {
      const s = useOrderCartStore()
      const order = makeOrderExt()
      s.loadFromOrder(order, aStore)

      expect(s.selStore).toEqual(aStore)
      expect(s.editingSeq).toBe(7)
      expect(s.isEditing).toBe(true)
      expect(s.memo).toBe('단무지 추가요')
      expect(s.cart).toEqual([
        { menuSeq: 101, nm: '김치찌개', price: 9000, cnt: 2 },
        { menuSeq: 102, nm: '비빔밥', price: 10000, cnt: 1 },
      ])
      expect(s.totalCount).toBe(3)
      expect(s.totalAmount).toBe(9000 * 2 + 10000)
    })

    it('cmt 가 null/undefined 면 memo 는 빈 문자열', () => {
      const s = useOrderCartStore()
      const order = makeOrderExt()
      order.cmt = null
      s.loadFromOrder(order, aStore)
      expect(s.memo).toBe('')
    })
  })

  describe('changeStore', () => {
    it('selStore 만 해제, cart / memo 는 유지', () => {
      const s = useOrderCartStore()
      s.setStore(aStore)
      s.addItem(menuKimchi)
      s.memo = '메모'
      s.changeStore()
      expect(s.selStore).toBeNull()
      expect(s.cart).toHaveLength(1)
      expect(s.memo).toBe('메모')
    })
  })

  describe('reset', () => {
    it('모든 상태 초기화', () => {
      const s = useOrderCartStore()
      s.loadFromOrder(makeOrderExt(), aStore)
      s.reset()
      expect(s.selStore).toBeNull()
      expect(s.cart).toEqual([])
      expect(s.memo).toBe('')
      expect(s.editingSeq).toBeNull()
      expect(s.isEditing).toBe(false)
    })
  })
})
