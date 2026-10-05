import { expect, test } from '@playwright/test'

import { createProduct, createUnit, expectToast, row, uid } from './helpers/api'

test.describe('제품 관리', () => {
  test('새 식자재로 제품을 등록한다 — 규격은 Enter / 추가 버튼으로 입력', async ({
    page,
    request,
  }) => {
    const id = uid()
    const liter = await createUnit(request, { nm: `L${id}`, isUnitCnt: true })

    await page.goto('/products')
    await page.getByRole('button', { name: '제품 등록' }).click()
    const dialog = page.getByRole('dialog', { name: '제품 등록' })

    await dialog.locator('.p-autocomplete input').fill(`들기름${id}`)
    await expect(dialog).toContainText(`'들기름${id}' 식자재가 새로 등록됩니다.`)
    // 제품명 기본값 = 식자재명
    await expect(dialog.getByPlaceholder('예: 오뚜기 알뜰당면')).toHaveValue(`들기름${id}`)

    await dialog.locator('.p-select').click()
    await page.getByRole('option', { name: liter.nm, exact: true }).click()

    // 규격 — InputNumber 는 blur 전까지 v-model 이 안 바뀌므로 타이핑 직후 Enter / 버튼이 동작하는지 확인
    const cnt = dialog.locator('.p-inputnumber input')
    await cnt.pressSequentially('1.8')
    await cnt.press('Enter')
    await cnt.pressSequentially('0.5')
    await dialog.getByRole('button', { name: '추가', exact: true }).click()
    await expect(dialog.locator('.p-chip')).toHaveText([`0.5${liter.nm}`, `1.8${liter.nm}`])

    await dialog.getByRole('button', { name: '등록' }).click()
    await expect(dialog).toBeHidden()

    const r = row(page, `들기름${id}`)
    await expect(r).toContainText(liter.nm)
    await expect(r).toContainText(`0.5${liter.nm}`)
    await expect(r).toContainText(`1.8${liter.nm}`)

    // 식자재 탭 — 자동 생성된 식자재, 제품 1개라 삭제 불가
    await page.goto('/master?tab=ingredients')
    const ingdRow = row(page, `들기름${id}`)
    await expect(ingdRow).toContainText('1')
    await expect(ingdRow.getByRole('button', { name: '삭제' })).toBeDisabled()
  })

  test('제품명을 직접 바꾸면 식자재를 바꿔도 덮어쓰지 않는다', async ({ page }) => {
    const id = uid()
    await page.goto('/products')
    await page.getByRole('button', { name: '제품 등록' }).click()
    const dialog = page.getByRole('dialog', { name: '제품 등록' })
    const ingd = dialog.locator('.p-autocomplete input')
    const nm = dialog.getByPlaceholder('예: 오뚜기 알뜰당면')

    await ingd.fill(`당면${id}`)
    await expect(nm).toHaveValue(`당면${id}`)
    await nm.fill(`오뚜기 알뜰당면${id}`)
    await ingd.fill(`잡채당면${id}`)

    await expect(nm).toHaveValue(`오뚜기 알뜰당면${id}`)
  })

  test('같은 제품명 + 단위는 중복 등록할 수 없다', async ({ page, request }) => {
    const id = uid()
    const kg = await createUnit(request, { nm: `kg${id}`, isUnitCnt: true })
    await createProduct(request, { ingdNm: `쌀${id}`, nm: `경기미${id}`, unitSeq: kg.seq })

    await page.goto('/products')
    await page.getByRole('button', { name: '제품 등록' }).click()
    const dialog = page.getByRole('dialog', { name: '제품 등록' })
    // 기존 식자재는 자동완성 목록에서 고른다
    await dialog.locator('.p-autocomplete input').pressSequentially(`쌀${id}`)
    await page.locator('.p-autocomplete-overlay').getByRole('option', { name: `쌀${id}` }).click()
    await dialog.getByPlaceholder('예: 오뚜기 알뜰당면').fill(`경기미${id}`)
    await dialog.locator('.p-select').click()
    await page.getByRole('option', { name: kg.nm, exact: true }).click()
    await dialog.getByRole('button', { name: '등록' }).click()

    await expectToast(page, `이미 등록된 제품입니다: 경기미${id} (${kg.nm})`)
    await expect(dialog).toBeVisible()
  })

  test('식자재 / 제품명으로 검색한다', async ({ page, request }) => {
    const id = uid()
    const unit = await createUnit(request, { nm: `단${id}`, isUnitCnt: false })
    await createProduct(request, { ingdNm: `대파${id}`, nm: `대파${id}`, unitSeq: unit.seq })
    await createProduct(request, { ingdNm: `국수${id}`, nm: `칼국수${id}`, unitSeq: unit.seq })

    await page.goto('/products')
    await page.getByPlaceholder('식자재 / 제품명 검색').fill(`국수${id}`)

    await expect(row(page, `칼국수${id}`)).toBeVisible()
    await expect(row(page, `대파${id}`)).toHaveCount(0)
  })
})
