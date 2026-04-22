import type { Store, StoreCategory } from '@/types/store'

/** 더미 매장 카테고리 — Figma Step1 탭 기준. */
export const DUMMY_STORE_CATEGORIES: StoreCategory[] = [
  { seq: 1, nm: '중앙' },
  { seq: 2, nm: '농협' },
  { seq: 3, nm: '대양' },
  { seq: 4, nm: '원예' },
  { seq: 5, nm: '외부' },
  { seq: 6, nm: '효성' },
  { seq: 7, nm: '글로벌' },
  { seq: 8, nm: '관련상가' },
]

/**
 * 더미 매장.
 * seq=1 (세림) 은 Figma Step3 에서 선택된 상태로 사용되므로 반드시 유지.
 */
export const DUMMY_STORES: Store[] = [
  { seq: 1, ctgSeq: 5, nm: '세림' },
  { seq: 2, ctgSeq: 1, nm: '3층사무실' },
  { seq: 3, ctgSeq: 1, nm: '본관 1층' },
  { seq: 4, ctgSeq: 2, nm: '농협 본점' },
  { seq: 5, ctgSeq: 2, nm: '농협 지점A' },
  { seq: 6, ctgSeq: 3, nm: '대양빌딩' },
  { seq: 7, ctgSeq: 4, nm: '원예 1층' },
  { seq: 8, ctgSeq: 4, nm: '원예 2층' },
  { seq: 9, ctgSeq: 6, nm: '효성센터' },
  { seq: 10, ctgSeq: 7, nm: '글로벌 타워' },
  { seq: 11, ctgSeq: 8, nm: '편의점 옆' },
  { seq: 12, ctgSeq: 8, nm: '약국 2층' },
]
