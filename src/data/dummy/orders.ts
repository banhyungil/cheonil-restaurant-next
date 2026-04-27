import type { OrderExt } from '@/types/order'

function minsAgo(mins: number): string {
  return new Date(Date.now() - mins * 60 * 1000).toISOString()
}

/**
 * 더미 주문 목록 팩토리. 호출 시점 기준으로 orderAt/cookedAt 재계산.
 * 주문현황 Figma (Step4) 기준 — 진행 중 4건 + 완료 2건.
 */
export function createDummyOrders(): OrderExt[] {
  return [
    {
      seq: 101,
      storeSeq: 3,
      storeNm: '본관 1층',
      storeCmt: '점심시간 러시 — 12:00~13:00 주문 몰림',
      amount: 16000,
      status: 'READY',
      orderAt: minsAgo(1),
      menus: [
        { menuSeq: 3, orderSeq: 101, menuNm: '김치찌개', price: 7000, cnt: 2 },
        { menuSeq: 11, orderSeq: 101, menuNm: '공깃밥', price: 1000, cnt: 2 },
      ],
    },
    {
      seq: 102,
      storeSeq: 6,
      storeNm: '대양빌딩',
      storeCmt: '엘리베이터 고장 시 계단 이용',
      amount: 15000,
      status: 'READY',
      orderAt: minsAgo(16),
      cmt: '덜맵게',
      menus: [
        { menuSeq: 5, orderSeq: 102, menuNm: '갈비탕', price: 10000, cnt: 1 },
        { menuSeq: 10, orderSeq: 102, menuNm: '계란말이', price: 5000, cnt: 1 },
      ],
    },
    {
      seq: 103,
      storeSeq: 7,
      storeNm: '원예 1층',
      amount: 28000,
      status: 'READY',
      orderAt: minsAgo(26),
      menus: [
        { menuSeq: 14, orderSeq: 103, menuNm: '콜라', price: 2000, cnt: 2 },
        { menuSeq: 1, orderSeq: 103, menuNm: '돈까스', price: 8000, cnt: 2 },
        { menuSeq: 2, orderSeq: 103, menuNm: '제육', price: 8000, cnt: 1 },
      ],
    },
    {
      seq: 104,
      storeSeq: 1,
      storeNm: '세림',
      storeCmt: '단골 매장. 11시 전 주문 필수, 배달 가능',
      amount: 23000,
      status: 'READY',
      orderAt: minsAgo(37),
      cmt: '맛있게',
      menus: [
        { menuSeq: 4, orderSeq: 104, menuNm: '된장찌개', price: 7000, cnt: 1 },
        { menuSeq: 2, orderSeq: 104, menuNm: '제육', price: 8000, cnt: 2 },
      ],
    },
    {
      seq: 105,
      storeSeq: 1,
      storeNm: '세림',
      storeCmt: '단골 매장. 11시 전 주문 필수, 배달 가능',
      amount: 16000,
      status: 'COOKED',
      orderAt: minsAgo(45),
      cookedAt: minsAgo(15),
      menus: [
        { menuSeq: 2, orderSeq: 105, menuNm: '제육', price: 8000, cnt: 1 },
        { menuSeq: 1, orderSeq: 105, menuNm: '돈까스', price: 8000, cnt: 1 },
      ],
    },
    {
      seq: 106,
      storeSeq: 2,
      storeNm: '3층사무실',
      amount: 16000,
      status: 'COOKED',
      orderAt: minsAgo(40),
      cookedAt: minsAgo(20),
      menus: [{ menuSeq: 13, orderSeq: 106, menuNm: '냉면', price: 8000, cnt: 2 }],
    },
  ]
}
