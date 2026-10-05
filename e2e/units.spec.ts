import { expect, test } from '@playwright/test'

import { acceptConfirm, createProduct, createUnit, expectToast, row, uid } from './helpers/api'

test.describe('마스터 관리 — 단위', () => {
  test('기준 단위와 환산계수를 지정해 추가하면 환산이 표시된다', async ({ page, request }) => {
    const id = uid()
    const kg = await createUnit(request, { nm: `kg${id}`, isUnitCnt: true })

    await page.goto('/master?tab=units')
    await page.getByRole('button', { name: '단위 추가' }).click()
    const dialog = page.getByRole('dialog', { name: '단위 추가' })
    await dialog.getByPlaceholder('예: kg, 박스').fill(`근${id}`)

    // 기준 단위를 고르기 전에는 환산계수 입력이 없다
    await expect(dialog.locator('.p-inputnumber')).toBeHidden()
    await dialog.locator('.p-select').click()
    await page.getByRole('option', { name: kg.nm, exact: true }).click()
    await dialog.locator('.p-inputnumber input').pressSequentially('0.6')
    await dialog.getByRole('button', { name: '추가' }).click()

    await expect(dialog).toBeHidden()
    await expect(row(page, `근${id}`)).toContainText(`1 근${id} = 0.6 ${kg.nm}`)
  })

  test('이름이 중복되면 오류를 보여주고 다이얼로그를 유지한다', async ({ page, request }) => {
    const unit = await createUnit(request, { nm: `박스${uid()}`, isUnitCnt: false })

    await page.goto('/master?tab=units')
    await page.getByRole('button', { name: '단위 추가' }).click()
    const dialog = page.getByRole('dialog', { name: '단위 추가' })
    await dialog.getByPlaceholder('예: kg, 박스').fill(unit.nm)
    await dialog.getByRole('button', { name: '추가' }).click()

    await expectToast(page, `이미 존재하는 단위입니다: ${unit.nm}`)
    await expect(dialog).toBeVisible()
  })

  test('제품에서 사용 중인 단위는 삭제할 수 없다', async ({ page, request }) => {
    const id = uid()
    const unit = await createUnit(request, { nm: `개${id}`, isUnitCnt: false })
    await createProduct(request, { ingdNm: `계란${id}`, nm: `계란${id}`, unitSeq: unit.seq })

    await page.goto('/master?tab=units')
    await row(page, unit.nm).getByRole('button', { name: '삭제' }).click()
    await acceptConfirm(page)

    await expectToast(page, '1개 제품에서 사용 중인 단위입니다.')
    await expect(row(page, unit.nm)).toBeVisible()
  })
})
