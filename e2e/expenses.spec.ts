import { expect, test } from '@playwright/test'

import {
  acceptConfirm,
  createExpense,
  createExpenseCtg,
  createStore,
  row,
  today,
  uid,
} from './helpers/api'

test.describe('지출내역', () => {
  test('지출을 등록하면 목록과 합계에 표시된다', async ({ page, request }) => {
    const id = uid()
    const ctg = await createExpenseCtg(request, { nm: `공과금${id}` })

    await page.goto('/expenses')
    await page.getByRole('button', { name: '지출 등록' }).click()
    const dialog = page.getByRole('dialog', { name: '지출 등록' })
    await dialog.locator('.p-treeselect').click()
    await page.locator('.p-treeselect-overlay').getByText(ctg.nm, { exact: true }).click()
    await dialog.getByPlaceholder('예: 전기요금, 채소').fill(`전기요금${id}`)
    // InputNumber — 타이핑 직후 저장 버튼이 활성화되는지 (blur 전 v-model 미반영 회귀 방지)
    await dialog.locator('.p-inputnumber input').pressSequentially('82500')
    await dialog.getByRole('button', { name: '등록' }).click()
    await expect(dialog).toBeHidden()

    // 기본 기간(이번 달 ~ 오늘) — 지출명으로 좁혀 합계 확인
    await page.getByPlaceholder('지출명 검색').fill(`전기요금${id}`)
    await page.getByRole('button', { name: '검색' }).click()
    const r = row(page, `전기요금${id}`)
    await expect(r).toContainText(ctg.nm)
    await expect(r).toContainText('82,500원')
    await expect(page.getByText('합계 82,500원')).toBeVisible()
  })

  test('같은 날 같은 매장 지출이 있으면 불러와서 수정한다', async ({ page, request }) => {
    const id = uid()
    const ctg = await createExpenseCtg(request, { nm: `채소${id}` })
    const store = await createStore(request, { nm: `농협${id}` })
    await createExpense(request, {
      ctgSeq: ctg.seq,
      storeSeq: store.seq,
      nm: `대파${id}`,
      amount: 10_000,
      expenseDt: today(),
    })

    await page.goto('/expenses')
    await page.getByRole('button', { name: '지출 등록' }).click()
    const dialog = page.getByRole('dialog', { name: '지출 등록' })
    await dialog.locator('.p-select').click()
    await page.getByRole('option', { name: store.nm, exact: true }).click()

    await expect(page.getByText(`'${store.nm}' 지출이 이미 있습니다.`)).toBeVisible()
    await page.getByRole('button', { name: '불러오기' }).click()

    const edit = page.getByRole('dialog', { name: '지출 수정' })
    await expect(edit.getByPlaceholder('예: 전기요금, 채소')).toHaveValue(`대파${id}`)
    const amount = edit.locator('.p-inputnumber input')
    await expect(amount).toHaveValue('10,000')
    await amount.press('ControlOrMeta+a')
    await amount.pressSequentially('15000')
    await edit.getByRole('button', { name: '수정' }).click()
    await expect(edit).toBeHidden()

    await page.getByPlaceholder('지출명 검색').fill(`대파${id}`)
    await page.getByRole('button', { name: '검색' }).click()
    await expect(row(page, `대파${id}`)).toContainText('15,000원')
    await expect(row(page, `대파${id}`)).toHaveCount(1)
  })

  test('카테고리로 필터하면 하위 카테고리 지출까지 조회된다', async ({ page, request }) => {
    const id = uid()
    const food = await createExpenseCtg(request, { nm: `식자재${id}` })
    const veg = await createExpenseCtg(request, { nm: `채소${id}`, parentSeq: food.seq })
    const ops = await createExpenseCtg(request, { nm: `운영비${id}` })
    await createExpense(request, {
      ctgSeq: veg.seq,
      nm: `양파${id}`,
      amount: 5_000,
      expenseDt: today(),
    })
    await createExpense(request, {
      ctgSeq: ops.seq,
      nm: `세제${id}`,
      amount: 3_000,
      expenseDt: today(),
    })

    await page.goto('/expenses')
    await page.locator('.p-treeselect').click()
    await page.locator('.p-treeselect-overlay').getByText(food.nm, { exact: true }).click()
    await page.getByRole('button', { name: '검색' }).click()

    await expect(row(page, `양파${id}`)).toContainText(`${food.nm} > ${veg.nm}`)
    await expect(row(page, `세제${id}`)).toHaveCount(0)
  })

  test('지출을 삭제한다', async ({ page, request }) => {
    const id = uid()
    const ctg = await createExpenseCtg(request, { nm: `인건비${id}` })
    await createExpense(request, {
      ctgSeq: ctg.seq,
      nm: `일당${id}`,
      amount: 80_000,
      expenseDt: today(),
    })

    await page.goto('/expenses')
    await page.getByPlaceholder('지출명 검색').fill(`일당${id}`)
    await page.getByRole('button', { name: '검색' }).click()
    await row(page, `일당${id}`).getByRole('button', { name: '삭제' }).click()
    await acceptConfirm(page)

    await expect(row(page, `일당${id}`)).toHaveCount(0)
    await expect(page.getByText('합계 0원')).toBeVisible()
  })
})
