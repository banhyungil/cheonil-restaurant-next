import type { Ingredient } from '@/types/product'

import { api } from './api'

/** 식자재 생성 / 이름 변경 페이로드. */
export interface IngredientSavePayload {
  nm: string
}

/** 식자재 전체 조회 (이름순, 제품 수 포함). */
export async function fetchList(): Promise<Ingredient[]> {
  return api.get<Ingredient[]>('/ingredients').then((r) => r.data)
}

/** 식자재 생성. 이름 중복이면 400. */
export async function create(payload: IngredientSavePayload): Promise<Ingredient> {
  return api.post<Ingredient>('/ingredients', payload).then((r) => r.data)
}

/** 식자재 이름 변경. */
export async function update(seq: number, payload: IngredientSavePayload): Promise<void> {
  return api.put(`/ingredients/${seq}`, payload).then(() => undefined)
}

/** 식자재 삭제. 제품이 등록돼 있으면 400. */
export async function remove(seq: number): Promise<void> {
  return api.delete(`/ingredients/${seq}`).then(() => undefined)
}
