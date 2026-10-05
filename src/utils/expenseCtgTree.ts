import type { TreeNode } from 'primevue/treenode'

import type { ExpenseCategory } from '@/types/expense'

/**
 * flat 지출 카테고리 → PrimeVue TreeNode 트리 (TreeTable / TreeSelect 공용).
 *
 * - key 는 seq 문자열, data 는 원본 ExpenseCategory
 * - 형제는 이름 가나다순 (path 는 seq 라벨이라 정렬 기준으로 쓰지 않는다)
 *
 * @param excludeSeq 이 카테고리와 그 하위를 제외 — 이동 대상 선택지에서 자기 자신/하위를 빼는 용도
 */
export function buildExpenseCtgTree(
  ctgs: readonly ExpenseCategory[],
  excludeSeq?: number | null,
): TreeNode[] {
  const byParent = new Map<number | null, ExpenseCategory[]>()
  for (const c of ctgs) {
    const list = byParent.get(c.parentSeq) ?? []
    list.push(c)
    byParent.set(c.parentSeq, list)
  }

  const build = (parentSeq: number | null): TreeNode[] =>
    (byParent.get(parentSeq) ?? [])
      .filter((c) => c.seq !== excludeSeq)
      .sort((a, b) => a.nm.localeCompare(b.nm, 'ko'))
      .map((c) => {
        const children = build(c.seq)
        return {
          key: String(c.seq),
          label: c.nm,
          data: c,
          ...(children.length > 0 && { children }),
        }
      })

  return build(null)
}

/** 전체 펼침 상태 — TreeTable expandedKeys 용. */
export function expandAllKeys(ctgs: readonly ExpenseCategory[]): Record<string, boolean> {
  return Object.fromEntries(ctgs.map((c) => [String(c.seq), true]))
}

/** "식자재 > 채소" 형태의 전체 경로 이름. */
export function expenseCtgFullNm(ctgs: readonly ExpenseCategory[], seq: number): string {
  const bySeq = new Map(ctgs.map((c) => [c.seq, c]))
  const target = bySeq.get(seq)
  if (!target) return ''
  return target.path
    .split('.')
    .map((s) => bySeq.get(Number(s))?.nm ?? '')
    .join(' > ')
}
