import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

import {
  createExpense,
  createExpenseCtg,
  createProduct,
  createStore,
  createUnit,
  fetchTodayExpense,
  today,
  uid,
} from './helpers/api'

/** 삼겹살(g, 규격 600) / 대파(단, 규격 없음) 제품 + 카테고리. */
async function seed(request: APIRequestContext, id: string) {
  const g = await createUnit(request, { nm: `g${id}`, isUnitCnt: true })
  const bunch = await createUnit(request, { nm: `단${id}`, isUnitCnt: false })
  const pork = await createProduct(request, {
    ingdNm: `돼지고기${id}`,
    nm: `삼겹살${id}`,
    unitSeq: g.seq,
    unitCnts: [600],
  })
  const leek = await createProduct(request, {
    ingdNm: `대파${id}`,
    nm: `대파${id}`,
    unitSeq: bunch.seq,
  })
  const ctg = await createExpenseCtg(request, { nm: `식자재${id}` })
  return { g, bunch, pork, leek, ctg }
}

async function openRegister(page: Page) {
  await page.goto('/expenses')
  await page.getByRole('button', { name: '지출 등록' }).click()
  return page.getByRole('dialog', { name: '지출 등록' })
}

test.describe('지출 — 구입목록', () => {
  test('제품을 고르고 단가를 넣으면 금액이 품목 합계로 채워진다', async ({ page, request }) => {
    const id = uid()
    const { g, bunch, pork, leek, ctg } = await seed(request, id)
    const dialog = await openRegister(page)

    await dialog.getByRole('button', { name: '제품 추가' }).click()
    const picker = page.getByRole('dialog', { name: '제품목록' })
    await picker.getByPlaceholder('식자재 / 제품명 검색').fill(id)
    const porkOpt = picker.getByRole('button', { name: new RegExp(`삼겹살${id} 600${g.nm}`) })
    await porkOpt.click()
    await porkOpt.click()
    await expect(porkOpt).toContainText('2개')
    await picker.getByRole('button', { name: new RegExp(`대파${id} \\(${bunch.nm}\\)`) }).click()
    await picker.getByRole('button', { name: 'Close' }).click()

    await dialog.getByLabel(`삼겹살${id} 단가`).pressSequentially('12000')
    await dialog.getByLabel(`대파${id} 단가`).pressSequentially('3000')
    await expect(dialog.getByRole('row', { name: new RegExp(`삼겹살${id}`) })).toContainText(
      '24,000원',
    )
    await expect(dialog.locator('.p-inputnumber input').first()).toHaveValue('27,000')

    await dialog.locator('.p-treeselect').click()
    await page.locator('.p-treeselect-overlay').getByText(ctg.nm, { exact: true }).click()
    await dialog.getByPlaceholder('예: 전기요금, 채소').fill(`장보기${id}`)
    await dialog.getByRole('button', { name: '등록' }).click()
    await expect(dialog).toBeHidden()

    const saved = await fetchTodayExpense(request, `장보기${id}`)
    expect(saved?.amount).toBe(27_000)
    expect(saved?.products.map((l) => [l.prdSeq, l.cnt, l.price, l.unitCnt])).toEqual([
      [pork.seq, 2, 12_000, 600],
      [leek.seq, 1, 3_000, null],
    ])
  })

  test('금액을 직접 고치면 품목 합계로 덮어쓰지 않고, 합계로 맞출 수 있다', async ({
    page,
    request,
  }) => {
    const id = uid()
    await seed(request, id)
    const dialog = await openRegister(page)

    await dialog.getByRole('button', { name: '제품 추가' }).click()
    const picker = page.getByRole('dialog', { name: '제품목록' })
    await picker.getByPlaceholder('식자재 / 제품명 검색').fill(`대파${id}`)
    await picker.getByRole('button', { name: new RegExp(`대파${id}`) }).click()
    await picker.getByRole('button', { name: 'Close' }).click()

    const amount = dialog.locator('.p-inputnumber input').first()
    const price = dialog.getByLabel(`대파${id} 단가`)
    await price.pressSequentially('10000')
    await expect(amount).toHaveValue('10,000')

    // 배송비 포함 금액으로 직접 수정 → 이후 단가를 바꿔도 유지
    await amount.press('ControlOrMeta+a')
    await amount.pressSequentially('11000')
    await price.press('ControlOrMeta+a')
    await price.pressSequentially('12000')
    await expect(amount).toHaveValue('11,000')
    await expect(dialog).toContainText('품목 합계 12,000원와 다릅니다')

    await dialog.getByRole('button', { name: '합계로 맞추기' }).click()
    await expect(amount).toHaveValue('12,000')
  })

  test('불러온 지출의 구입목록을 고치면 전체 교체된다', async ({ page, request }) => {
    const id = uid()
    const { pork, leek, ctg } = await seed(request, id)
    const store = await createStore(request, { nm: `정육점${id}` })
    await createExpense(request, {
      ctgSeq: ctg.seq,
      storeSeq: store.seq,
      nm: `고기${id}`,
      amount: 24_000,
      expenseDt: today(),
      products: [
        { prdSeq: pork.seq, cnt: 2, price: 12_000, unitCnt: 600 },
        { prdSeq: leek.seq, cnt: 1, price: 3_000, unitCnt: null },
      ],
    })

    const dialog = await openRegister(page)
    await dialog.locator('.p-select').click()
    await page.getByRole('option', { name: store.nm, exact: true }).click()
    await page.getByRole('button', { name: '불러오기' }).click()

    const edit = page.getByRole('dialog', { name: '지출 수정' })
    // 저장된 금액(24,000)이 품목 합계(27,000)와 달라 직접 정한 금액으로 유지된다
    await expect(edit.locator('.p-inputnumber input').first()).toHaveValue('24,000')
    await edit
      .getByRole('row', { name: new RegExp(`삼겹살${id}`) })
      .locator('.p-inputnumber-increment-button')
      .click()
    await edit
      .getByRole('row', { name: new RegExp(`대파${id}`) })
      .getByRole('button', { name: '품목 삭제' })
      .click()
    await edit.getByRole('button', { name: '수정' }).click()
    await expect(edit).toBeHidden()

    const saved = await fetchTodayExpense(request, `고기${id}`)
    expect(saved?.products.map((l) => [l.prdSeq, l.cnt, l.unitCnt])).toEqual([[pork.seq, 3, 600]])
  })
})
