# 천일식당 - 기존 프로젝트 기능 목록

> 기존 프로젝트(`cheonil-restaurant`) 기반 전체 기능 정리

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Vue 3 (Composition API + TypeScript) |
| 라우팅 | Vue Router 4 |
| 상태관리 | Pinia (localStorage 영속화) |
| UI | Vuetify 3, Tailwind CSS, SCSS |
| HTTP | Axios |
| 실시간 | WebSocket |
| 유효성검사 | Vuelidate 2 |
| 기타 | date-fns, lodash, hangul-util, SweetAlert2 |

---

## 1. 주문 관리

| 기능 | 라우트 | 설명 |
|------|--------|------|
| 주문 생성/수정 | `/order`, `/order/:seq` | 매장 선택 후 메뉴 추가, 수량 관리, 총액 계산 |
| 주문 상태 추적 | `/orderState` | READY → COOKED → PAID 워크플로우, WebSocket 실시간 갱신, 경과시간 표시 |
| 주문 내역 조회 | `/orderList` | 날짜/결제수단/매장 필터, 페이지네이션, 요약 통계 |
| 정산 (수금) | `/collection` | 일별 카드/현금/미수금 정산, 단건/일괄 수금, 수금 취소 |

### 주문 상태 흐름

```
READY(접수) → COOKED(조리완료) → PAID(결제완료)
```

### API

- `selectList(whereInfo?)` - 주문 목록 조회 (필터/페이지네이션)
- `selectListAccount(dateRange)` - 일별 정산 주문 조회
- `select(seq)` - 단건 조회
- `create(order, orderMenues)` - 주문 생성
- `update(order, orderMenues)` - 주문 수정
- `remove(seq)` - 주문 삭제
- `collect(seq, payments)` - 수금 처리
- `collectList(list)` - 일괄 수금
- `cancelCollect(seq)` - 수금 취소
- `cancelCollectList(seqs)` - 일괄 수금 취소

---

## 2. 메뉴 관리

| 기능 | 라우트 | 설명 |
|------|--------|------|
| 메뉴 조회 | `/menu` | 카테고리별 메뉴 표시, 한글 초성 검색, 즐겨찾기 |
| 메뉴 생성/수정 | `/menuEdit`, `/menuEdit/:seq` | 이름, 약어, 카테고리, 가격, 비고 |
| 메뉴 카테고리 관리 | `/menuCtgEdit`, `/menuCtgEdit/:seq` | 카테고리 CRUD, 중복 검증, 삭제 시 소속 메뉴 연쇄 삭제 |

### 부가 기능

- 드래그앤드롭 메뉴 순서 변경
- 드래그앤드롭 카테고리 순서 변경
- 한글 초성 검색 (`hangul-util`)
- 편집 모드 토글

---

## 3. 매장 관리

| 기능 | 라우트 | 설명 |
|------|--------|------|
| 매장 조회 | `/store` | 카테고리별 매장 표시, 검색, 즐겨찾기 |
| 매장 생성/수정 | `/storeEdit`, `/storeEdit/:seq` | 이름, 카테고리, 장소 카테고리 |
| 매장 카테고리 관리 | `/storeCtgEdit`, `/storeCtgEdit/:seq` | 카테고리 CRUD, 장소 카테고리 매핑 |
| 장소 카테고리 관리 | `/placeCtgEdit`, `/placeCtgEdit/:seq` | 장소/구역 분류 CRUD |

### 부가 기능

- 드래그앤드롭 매장/카테고리 순서 변경
- 한글 초성 검색
- 편집 모드 토글

---

## 4. 결제 관리

| 기능 | 설명 |
|------|------|
| 복수 결제 수단 | 카드(CARD), 현금(CASH) 지원 |
| 미수금 관리 | UNPAID 상태 주문 추적 |
| 수금 처리 | 단건/일괄 수금, 수금 취소 |
| 일별 정산 | 날짜별 결제 요약 (카드/현금/미수금 합계) |

### API

- `create(payment)` - 결제 생성
- `update(payment)` - 결제 수정
- `remove(payments)` - 결제 일괄 삭제

---

## 5. 공급/재료 관리

| 기능 | 라우트 | 설명 |
|------|--------|------|
| 공급 목록 | `/supply` | 재료/공급품 목록, 페이지네이션 |
| 공급 생성/수정 | `/supplyEdit/:seq?` | 재료 CRUD, 중복 검증 |

---

## 6. 상품 관리

| 기능 | 라우트 | 설명 |
|------|--------|------|
| 상품 목록 | `/product` | 공급처별 상품 표시, 단위 정보 |
| 상품 생성/수정 | `/productEdit/:seq?` | 공급 재료 선택, 단위 할당, 일괄 생성 |
| 단위 관리 | `/unitEdit` | 단위(개, g, L 등) CRUD, 단위수량 플래그 |

### API

- `selectList(query)` - 상품 목록 (prdInfo, unit 확장 가능)
- `createList(mpus)` - 일괄 생성
- `deleteProductInfo(prdInfoSeq)` - 상품 정보 삭제

---

## 7. 지출 관리

| 기능 | 라우트 | 설명 |
|------|--------|------|
| 지출 목록 | `/expenseList` | 지출 내역 조회 |
| 지출 생성/수정 | `/expenseEdit/:seq?` | 카테고리 선택, 금액/날짜 입력, 인라인 카테고리 관리 |

---

## 8. 설정

| 기능 | 설명 |
|------|------|
| 매장 카테고리 정렬 | 카테고리 표시 순서 커스터마이징 |
| 메뉴 카테고리 정렬 | 카테고리 표시 순서 커스터마이징 |
| 즐겨찾기 순서 | 메뉴/매장 즐겨찾기 순서 관리 |
| localStorage 영속화 | 설정값 브라우저 저장 |

---

## 9. 공통 기능 / 재사용 컴포넌트

### Composables (커스텀 훅)

| 이름 | 용도 |
|------|------|
| `useAlert` | 알림/노티피케이션 |
| `useCheckAll` | 전체 선택 체크박스 |
| `useClickOutside` | 외부 클릭 감지 |
| `useDirty` | 폼 변경 상태 추적 |
| `useFilterCho` | 한글 초성 필터 |
| `useMoveCell` | 테이블 셀 이동 |
| `useOrderBy` | 동적 정렬 |
| `usePagination` | 페이지네이션 |
| `useSwal` | SweetAlert2 다이얼로그 |
| `useToast` | 토스트 알림 |

### 레이아웃

| 레이아웃 | 용도 |
|----------|------|
| `DefaultLayout` | 주문/메뉴 등 메인 화면 |
| `AdminLayout` | 관리/설정 화면 |

### 실시간 기능

- WebSocket을 통한 주문 상태 실시간 동기화
- POST/PATCH/DELETE 이벤트 수신

---

## 10. 데이터 모델

| 엔티티 | 설명 |
|--------|------|
| `Order` | 주문 (매장, 메뉴, 금액, 상태, 결제) |
| `OrderMenu` | 주문 내 메뉴 항목 |
| `Payment` | 결제 (수단, 금액, 일시) |
| `MenuEntity` | 메뉴 |
| `MenuCategoryEntity` | 메뉴 카테고리 |
| `StoreEntity` | 매장 |
| `StoreCategoryEntity` | 매장 카테고리 |
| `PlaceCategoryEntity` | 장소 카테고리 |
| `SupplyEntity` | 공급/재료 |
| `ProductEntity` | 상품 |
| `ProductInfoEntity` | 상품 메타 (단위 매핑) |
| `UnitEntity` | 단위 |
| `ExpenseEntity` | 지출 |
| `ExpenseCategoryEntity` | 지출 카테고리 |
| `SettingEntity` | 앱 설정 |
