import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'

/**
 * order(seq[]) 에 따라 items 를 정렬한 결과 반환.
 * order 에 없는 item 은 끝에 append (원래 상대 순서 유지) — 신규 추가 row 자동 표시 보장.
 *
 * @example
 *   const cSortedStores = useSortedItems(stores, () => storeOrder?.effectiveConfig.order ?? [])
 */
export function useSortedItems<T extends { seq: number }>(
  items: MaybeRefOrGetter<readonly T[] | undefined>,
  order: MaybeRefOrGetter<readonly number[]>,
): ComputedRef<T[]> {
  return computed(() => {
    const list = toValue(items) ?? []
    const seqOrder = toValue(order)
    if (seqOrder.length === 0) return [...list]

    const indexMap = new Map(seqOrder.map((seq, i) => [seq, i]))
    return [...list].sort((a, b) => {
      const ai = indexMap.get(a.seq) ?? Number.MAX_SAFE_INTEGER
      const bi = indexMap.get(b.seq) ?? Number.MAX_SAFE_INTEGER
      return ai - bi
    })
  })
}
