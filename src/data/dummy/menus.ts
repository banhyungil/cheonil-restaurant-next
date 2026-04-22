import type { Menu, MenuCategory } from '@/types/menu'

/**
 * 더미 메뉴 카테고리.
 * "전체" 탭은 UI 전용이므로 여기 포함하지 않음 — 컴포넌트에서 seq=0 로 추가.
 */
export const DUMMY_MENU_CATEGORIES: MenuCategory[] = [
  { seq: 1, nm: '식사' },
  { seq: 2, nm: '찌개' },
  { seq: 3, nm: '탕' },
  { seq: 4, nm: '구이' },
  { seq: 5, nm: '면' },
  { seq: 6, nm: '음료' },
]

/** 더미 메뉴 — Figma Step3 기준 15개. */
export const DUMMY_MENUS: Menu[] = [
  { seq: 1, ctgSeq: 1, nm: '돈까스', price: 8000 },
  { seq: 2, ctgSeq: 1, nm: '제육', price: 8000 },
  { seq: 3, ctgSeq: 2, nm: '김치찌개', price: 7000 },
  { seq: 4, ctgSeq: 2, nm: '된장찌개', price: 7000 },
  { seq: 5, ctgSeq: 3, nm: '갈비탕', price: 10000 },
  { seq: 6, ctgSeq: 1, nm: '비빔밥', price: 8000 },
  { seq: 7, ctgSeq: 4, nm: '불고기', price: 9000 },
  { seq: 8, ctgSeq: 3, nm: '삼계탕', price: 12000 },
  { seq: 9, ctgSeq: 1, nm: '제육덮밥', price: 8000 },
  { seq: 10, ctgSeq: 4, nm: '계란말이', price: 5000 },
  { seq: 11, ctgSeq: 1, nm: '공깃밥', price: 1000 },
  { seq: 12, ctgSeq: 5, nm: '라면', price: 4000 },
  { seq: 13, ctgSeq: 5, nm: '냉면', price: 8000 },
  { seq: 14, ctgSeq: 6, nm: '콜라', price: 2000 },
  { seq: 15, ctgSeq: 6, nm: '사이다', price: 2000 },
]
