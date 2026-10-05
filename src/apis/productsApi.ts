import type { Product } from '@/types/product'

import { api } from './api'

/**
 * 제품 생성/수정 페이로드 (PUT 전체 교체).
 * 식자재는 이름으로 찾고 없으면 서버가 생성한다.
 */
export interface ProductSavePayload {
  ingdNm: string
  nm: string
  unitSeq: number
  /** 규격 목록. 단위수량 미사용 단위면 서버가 무시. */
  unitCnts: number[]
}

/** 제품 전체 조회 (식자재명 / 제품명 / 단위명 순). */
export async function fetchList(): Promise<Product[]> {
  return api.get<Product[]>('/products').then((r) => r.data)
}

/** 제품 생성. 같은 (제품명, 단위) 가 있으면 400. */
export async function create(payload: ProductSavePayload): Promise<Product> {
  return api.post<Product>('/products', payload).then((r) => r.data)
}

/** 제품 전체 수정 (PUT 교체). */
export async function update(seq: number, payload: ProductSavePayload): Promise<Product> {
  return api.put<Product>(`/products/${seq}`, payload).then((r) => r.data)
}

/** 제품 삭제. 지출에서 사용 중이면 400. */
export async function remove(seq: number): Promise<void> {
  return api.delete(`/products/${seq}`).then(() => undefined)
}
