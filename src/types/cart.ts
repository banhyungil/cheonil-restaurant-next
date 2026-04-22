/**
 * 주문 카트 아이템 (UI 상태 전용, DB 테이블 아님)
 * price 는 카트 추가 시점의 스냅샷 — 이후 메뉴 가격이 변해도 주문 생성 시 이 값을 사용
 */
export interface CartItem {
  menuSeq: number
  nm: string
  price: number
  cnt: number
}
