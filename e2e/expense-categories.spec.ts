import { expect, test } from '@playwright/test'

import {
  acceptConfirm,
  createExpenseCtg,
  expectToast,
  fetchExpenseCtgs,
  row,
  uid,
} from './helpers/api'

test.describe('마스터 관리 — 지출 카테고리', () => {
  test('최상위와 하위 카테고리를 추가한다', async ({ page, request }) => {
    const id = uid()
    await page.goto('/master?tab=expenseCtgs')

    await page.getByRole('button', { name: '카테고리 추가' }).click()
    let dialog = page.getByRole('dialog', { name: '카테고리 추가' })
    await dialog.getByPlaceholder('예: 식자재, 공과금').fill(`식자재${id}`)
    await dialog.getByRole('button', { name: '추가' }).click()
    await expect(dialog).toBeHidden()

    // 행의 "하위 카테고리 추가" 버튼 → 상위가 미리 선택된 채로 열린다
    await row(page, `식자재${id}`).getByRole('button', { name: '하위 카테고리 추가' }).click()
    dialog = page.getByRole('dialog', { name: '카테고리 추가' })
    await expect(dialog.locator('.p-treeselect')).toContainText(`식자재${id}`)
    await dialog.getByPlaceholder('예: 식자재, 공과금').fill(`채소${id}`)
    await dialog.getByRole('button', { name: '추가' }).click()
    await expect(dialog).toBeHidden()

    await expect(row(page, `채소${id}`)).toBeVisible()
    const ctgs = await fetchExpenseCtgs(request)
    const parent = ctgs.find((c) => c.nm === `식자재${id}`)!
    const child = ctgs.find((c) => c.nm === `채소${id}`)!
    expect(child.parentSeq).toBe(parent.seq)
    expect(child.path).toBe(`${parent.path}.${child.seq}`)
  })

  test('상위를 바꾸면 하위 트리째 이동한다', async ({ page, request }) => {
    const id = uid()
    const food = await createExpenseCtg(request, { nm: `식자재${id}` })
    const ops = await createExpenseCtg(request, { nm: `운영비${id}` })
    const veg = await createExpenseCtg(request, { nm: `채소${id}`, parentSeq: food.seq })
    const leaf = await createExpenseCtg(request, { nm: `잎채소${id}`, parentSeq: veg.seq })

    await page.goto('/master?tab=expenseCtgs')
    await row(page, `채소${id}`).getByRole('button', { name: '수정' }).click()
    const dialog = page.getByRole('dialog', { name: '카테고리 수정' })
    await dialog.locator('.p-treeselect').click()
    const overlay = page.locator('.p-treeselect-overlay')
    // 자기 자신은 이동 대상에서 빠진다
    await expect(overlay.getByText(`채소${id}`, { exact: true })).toHaveCount(0)
    await overlay.getByText(`운영비${id}`, { exact: true }).click()
    await dialog.getByRole('button', { name: '수정' }).click()
    await expect(dialog).toBeHidden()

    const ctgs = await fetchExpenseCtgs(request)
    expect(ctgs.find((c) => c.seq === veg.seq)!.path).toBe(`${ops.seq}.${veg.seq}`)
    expect(ctgs.find((c) => c.seq === leaf.seq)!.path).toBe(`${ops.seq}.${veg.seq}.${leaf.seq}`)
  })

  test('하위 카테고리가 있으면 삭제할 수 없다', async ({ page, request }) => {
    const id = uid()
    const parent = await createExpenseCtg(request, { nm: `공과금${id}` })
    await createExpenseCtg(request, { nm: `전기${id}`, parentSeq: parent.seq })

    await page.goto('/master?tab=expenseCtgs')
    await row(page, `공과금${id}`).getByRole('button', { name: '삭제' }).click()
    await acceptConfirm(page)

    await expectToast(page, '하위 카테고리가 있어 삭제할 수 없습니다.')
    await expect(row(page, `공과금${id}`)).toBeVisible()
  })
})
