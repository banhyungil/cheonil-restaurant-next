import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useSortedItems } from '@/composables/useSortedItems'

interface Row {
  seq: number
  nm: string
}

const A: Row = { seq: 1, nm: 'A' }
const B: Row = { seq: 2, nm: 'B' }
const C: Row = { seq: 3, nm: 'C' }
const D: Row = { seq: 4, nm: 'D' }

describe('useSortedItems', () => {
  it('order 가 비어있으면 입력 순서 그대로 (shallow copy)', () => {
    const sorted = useSortedItems(() => [A, B, C], () => [])
    expect(sorted.value).toEqual([A, B, C])
  })

  it('items 가 undefined 면 빈 배열', () => {
    const sorted = useSortedItems(() => undefined, () => [1, 2])
    expect(sorted.value).toEqual([])
  })

  it('order 에 명시된 순서로 정렬', () => {
    const sorted = useSortedItems(
      () => [A, B, C],
      () => [3, 1, 2],
    )
    expect(sorted.value.map((r) => r.seq)).toEqual([3, 1, 2])
  })

  it('order 에 없는 항목은 끝에 append, 원래 상대 순서 유지', () => {
    // order=[2] 만 지정. A, C, D 는 신규 추가된 row 라 가정 → 뒤에 그대로 따라옴.
    const sorted = useSortedItems(
      () => [A, B, C, D],
      () => [2],
    )
    expect(sorted.value.map((r) => r.seq)).toEqual([2, 1, 3, 4])
  })

  it('reactive items / order 변경에 재계산', () => {
    const items = ref<Row[]>([A, B])
    const order = ref<number[]>([2, 1])
    const sorted = useSortedItems(items, order)

    expect(sorted.value.map((r) => r.seq)).toEqual([2, 1])

    items.value = [A, B, C]
    expect(sorted.value.map((r) => r.seq)).toEqual([2, 1, 3])

    order.value = [3, 1, 2]
    expect(sorted.value.map((r) => r.seq)).toEqual([3, 1, 2])
  })

  it('원본 items 배열을 변형하지 않음 (immutable)', () => {
    const original = [C, A, B]
    const sorted = useSortedItems(
      () => original,
      () => [1, 2, 3],
    )
    expect(sorted.value.map((r) => r.seq)).toEqual([1, 2, 3])
    // 원본은 그대로
    expect(original).toEqual([C, A, B])
  })
})
