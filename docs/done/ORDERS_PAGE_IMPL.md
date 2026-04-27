# OrdersPage 구현 계획

> 기반 Figma: `lZH7QriZ8dnUOfNhx4D2Mr` / Step3 노드 `19:374`
> 선행 문서: [ORDER_PAGES_REVIEW.md](./ORDER_PAGES_REVIEW.md) — 설계 검토 및 blocking 항목
> 관련 토큰: [theme.css](../src/style/theme.css), [DESIGN_TOKENS.md](./DESIGN_TOKENS.md)

## 0. 범위 (1차 구현)

- **Step3 (카트 채워진 상태) 한 가지만** 먼저 정적 구현
- 더미 데이터는 `src/data/dummy/` 에 분리 — 이후 API 교체 포인트 명확화
- 카트 상태는 페이지 내부 `ref` 로 시작 — Pinia 승격은 2차
- 매장 선택 전/후 상태 분기는 **데이터 연결 단계 (이 문서 범위 밖)**

빌드 체크포인트마다 브라우저 육안 확인 가능한 단위로 끊어서 진행.

---

## 1. Figma 에서 확정된 레이아웃 수치

```
┌─ AppLayout ────────────────────────────────────────────────┐
│ Sidebar    │  OrdersPage                                   │
│ 220        │  ┌─ main (gap 24) ──────────────────────┐     │
│            │  │  left 1092      │  right 520         │     │
│            │  │  ─────          │  ─────             │     │
│            │  │  search 240×56  │  StoreHeader 48    │     │
│            │  │  CategoryTabs   │  ─ divider ─       │     │
│            │  │  grid 5×N       │  CartItemRow×N     │     │
│            │  │   card 202×110  │  ─ divider ─       │     │
│            │  │                 │  memo textarea 80  │     │
│            │  │                 │  total row 36      │     │
│            │  │                 │  CTA 60            │     │
│            │  └──────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────┘
```

### 카드·아이템 세부

| 요소               | 크기    | 비고                                       |
| ------------------ | ------- | ------------------------------------------ |
| MenuCard           | 202×110 | 이름 16px/semibold + 가격 13px             |
| MenuCard (선택됨)  | 202×110 | bg `primary-50` + border `primary-500`     |
| CartItemRow        | 472×76  | lc 200 + `−` 34 + qty 44 + `+` 34 + sub 70 |
| CTA "주문완료"     | 472×60  | bg `primary-500` / 17px bold white         |
| StoreHeader "세림" | 472×48  | 🏪 아이콘 + 매장명 + 리셋버튼 40           |

### 색상 매핑 (Figma hex → 프로젝트 토큰)

| Figma                 | 토큰                        | 용도                 |
| --------------------- | --------------------------- | -------------------- |
| `#4fb294`             | `primary-500`               | 브랜드 / 선택 / CTA  |
| `#e5f5f0`             | `primary-50`                | 선택된 카드 배경     |
| `#388f75`             | `primary-600`/`primary-700` | 선택 카드 텍스트     |
| `#e0e5eb`             | `surface-200`               | 카드 테두리, divider |
| `#212933`             | `surface-900`               | 본문 텍스트          |
| `#73808c`             | `surface-500`               | 보조/placeholder     |
| `#c7d1de` / `#c2ccd4` | `surface-300`               | input/버튼 테두리    |

---

## 2. 더미 데이터 구조 (`src/data/dummy/`)

DDL과 1:1 매핑 — 이후 API 교체 시 타입만 유지.

```ts
// dummy/menus.ts
export const DUMMY_MENU_CATEGORIES = [
  { seq: 0,  nm: '전체' },   // UI 전용 (DB 없음)
  { seq: 1,  nm: '식사' },
  { seq: 2,  nm: '찌개' },
  { seq: 3,  nm: '탕' },
  { seq: 4,  nm: '구이' },
  { seq: 5,  nm: '면' },
  { seq: 6,  nm: '음료' },
] as const

export const DUMMY_MENUS = [
  { seq: 1, ctgSeq: 1, nm: '돈까스',   price: 8000 },
  { seq: 2, ctgSeq: 1, nm: '제육',     price: 8000 },
  { seq: 3, ctgSeq: 2, nm: '김치찌개', price: 7000 },
  ...
]

// dummy/stores.ts
export const DUMMY_STORE_CATEGORIES = [...]
export const DUMMY_STORES = [...]
```

**주의**: Figma 메뉴 가격이 `7000원` / `8,000원` 형식이 혼재 — 데이터는 number로 두고 **렌더링 시점에 `Intl.NumberFormat('ko-KR')` 으로 통일** (`8,000원`).

---

## 3. 컴포넌트 분해

### 트리 구조 (1차 범위)

```
OrdersPage.vue                          ← 쉘 + 상태
├─ MenuGrid.vue                         ← 좌측 (검색 + 탭 + 카드 그리드)
│   ├─ <PrimeVue InputText>             ← 메뉴 검색 (UI만)
│   ├─ CategoryTabs.vue                 ← 공통 탭
│   └─ MenuCard.vue × N                 ← 선택 variant 포함
└─ OrderCartPanel.vue                   ← 우측 패널
    ├─ StoreSelectHeader.vue            ← 🏪 매장명 + 리셋
    ├─ CartItemRow.vue × N              ← − / qty / +
    ├─ <PrimeVue Textarea>              ← 비고
    ├─ CartSummary.vue                  ← 총 건수 + 총액
    └─ <PrimeVue Button> (주문완료 CTA)
```

### 만들어야 할 파일 (1차 범위)

| 파일 경로                                               | 상태                                                     | 역할                                 |
| ------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------ |
| `src/pages/OrdersPage.vue`                              | 빈 스텁                                                  | 쉘 + cart/memo/selStore 상태         |
| `src/components/grid/MenuGrid.vue`                      | **신규**                                                 | 좌측 메뉴 그리드 (검색+탭+카드)      |
| `src/components/CategoryTabs.vue`                       | **rename** (기존 `CategoryTab.vue` → `CategoryTabs.vue`) | 공통 탭                              |
| `src/components/card/MenuCard.vue`                      | 빈 스텁                                                  | 202×110 카드                         |
| `src/components/panel/order-cart/OrderCartPanel.vue`    | 빈 스텁                                                  | 우측 패널 컨테이너                   |
| `src/components/panel/order-cart/StoreSelectHeader.vue` | 빈 스텁                                                  | 매장명 헤더                          |
| `src/components/panel/order-cart/CartItemRow.vue`       | 빈 스텁                                                  | 카트 row                             |
| `src/components/panel/order-cart/CartSummary.vue`       | 빈 스텁                                                  | 총계                                 |
| `src/data/dummy/menus.ts`                               | **신규**                                                 | 더미 메뉴 데이터                     |
| `src/data/dummy/stores.ts`                              | **신규**                                                 | 더미 매장 데이터 (selStore 기본값용) |

### 2차로 미루는 것

- `src/components/grid/StoreGrid.vue` (Step1 매장 선택)
- `src/components/card/StoreCard.vue` (이미 빈 스텁, 건드리지 않음)
- 매장 hover tooltip

### 각 컴포넌트 Props·Emits

#### `CategoryTabs.vue`

공통 탭. Store/Menu 양쪽에서 재사용.

```ts
interface Props {
  categories: readonly { seq: number; nm: string }[];
  modelValue: number; // 선택된 ctg seq (0 = 전체)
}
defineEmits<{ "update:modelValue": [seq: number] }>();
```

#### `MenuGrid.vue`

좌측 전체 블록을 소유. 검색어·선택 카테고리는 **내부 state**.

```ts
interface Props {
  menus: readonly { seq: number; nm: string; price: number; ctgSeq: number }[];
  categories: readonly { seq: number; nm: string }[];
  selectedMenuSeqs: number[]; // 카트에 담긴 것들 (카드 하이라이트용)
}
defineEmits<{ add: [menuSeq: number] }>();
```

- 내부: `selCtg`, `searchKeyword` ref
- computed `cFilteredMenus`: 카테고리 + 검색어 필터링
- 카드 클릭 → `emit('add', seq)`

#### `MenuCard.vue`

```ts
interface Props {
  menu: { seq: number; nm: string; price: number };
  isSelected?: boolean; // 카트에 담겼는지 (hightlight)
}
defineEmits<{ click: [seq: number] }>();
```

#### `OrderCartPanel.vue`

우측 전체 블록 소유. 상태별 렌더(빈/매장만/카트있음) 1차엔 **카트있음만**.

```ts
interface Props {
  store: { seq: number; nm: string }; // 1차엔 항상 전달 (하드코딩 매장)
  items: CartItem[];
  memo: string;
}
defineEmits<{
  "update:memo": [value: string];
  increment: [menuSeq: number];
  decrement: [menuSeq: number];
  reset: []; // 매장 초기화 (카트 비움)
  checkout: [];
}>();
```

#### `StoreSelectHeader.vue`

```ts
interface Props {
  storeName: string;
}
defineEmits<{ reset: [] }>();
```

#### `CartItemRow.vue`

```ts
interface Props {
  item: { menuSeq: number; nm: string; price: number; cnt: number };
}
defineEmits<{
  increment: [menuSeq: number];
  decrement: [menuSeq: number]; // cnt가 0이 되면 제거는 상위(OrdersPage)에서 처리
}>();
```

- `cSubTotal = price * cnt` 내부 computed

#### `CartSummary.vue`

```ts
interface Props {
  totalCount: number;
  totalAmount: number;
}
```

### OrdersPage.vue (쉘) — 상태·핸들러

```ts
interface CartItem {
  menuSeq: number;
  nm: string;
  price: number;
  cnt: number;
}

const cart = ref<CartItem[]>([]);
const memo = ref("");
const selStore = ref(DUMMY_STORES[0]); // 1차 하드코딩 (세림)

const cSelMenuSeqs = computed(() => cart.value.map((i) => i.menuSeq));
const cTotalCount = computed(() => _.sumBy(cart.value, "cnt"));
const cTotalAmount = computed(() =>
  _.sumBy(cart.value, (i) => i.price * i.cnt),
);

function onAddMenu(seq: number) {
  const existing = cart.value.find((i) => i.menuSeq === seq);
  if (existing) {
    existing.cnt++;
    return;
  }
  const menu = DUMMY_MENUS.find((m) => m.seq === seq)!;
  cart.value.push({
    menuSeq: menu.seq,
    nm: menu.nm,
    price: menu.price,
    cnt: 1,
  });
}
function onIncrement(seq: number) {
  /* 찾아서 cnt++ */
}
function onDecrement(seq: number) {
  /* cnt--, 0이면 splice */
}
function onResetCart() {
  cart.value = [];
  memo.value = "";
}
function onCheckout() {
  console.log("checkout", { cart, memo, selStore });
}
```

---

## 4. 구현 순서 (체크포인트)

각 단계 끝나면 `npm run dev` 로 브라우저 확인. 파일 단위로 끊어서 한 번에 1-2개씩 다룸.

1. **더미 데이터 파일** — `data/dummy/menus.ts`, `data/dummy/stores.ts` 작성
2. **OrdersPage 스켈레톤** — 3-column 쉘 + inline div (더미 5×N grid + inline 카트 UI)
   - 체크포인트: Figma Step3 과 시각적으로 일치
3. **CategoryTabs 추출** — 기존 `CategoryTab.vue` 를 `CategoryTabs.vue` 로 rename 하고 채움
4. **MenuCard 추출** — grid 카드 → 컴포넌트, 선택 상태 prop
5. **MenuGrid 추출** — 좌측 블록 통째로 컴포넌트로 분리, 내부 state (selCtg, searchKeyword) 이동
6. **OrderCartPanel + 하위 3개 추출** — StoreSelectHeader / CartItemRow / CartSummary
7. **카트 수량 동작** — `−`/`+` 핸들러 연결, 0이면 자동 제거
8. **비고 textarea** — PrimeVue `Textarea` v-model
9. **주문완료 CTA** — PrimeVue `Button` + `console.log` 스텁

각 단계는 **이전 단계가 브라우저에서 정상 렌더**됨을 확인한 뒤 다음으로.

---

## 5. 의존성 / 재사용

| 용도       | 선택                                                    | 비고                                   |
| ---------- | ------------------------------------------------------- | -------------------------------------- |
| 그리드     | CSS grid                                                | Tailwind `grid grid-cols-5 gap-5`      |
| 탭         | 커스텀 div                                              | PrimeVue Tabs 는 스타일 자유도 낮음    |
| 버튼 (−/+) | 커스텀 div + click                                      | PrimeVue Button은 size 맞추기 번거로움 |
| textarea   | PrimeVue `Textarea`                                     | 비고 입력                              |
| CTA        | PrimeVue `Button` (severity=success, large) 또는 커스텀 | 테마 컬러 일치 확인 필요               |
| 숫자 포맷  | `Intl.NumberFormat('ko-KR')`                            | `8,000원`                              |
| 아이콘     | lucide-vue-next                                         | `Search`, `Store`, `RotateCcw` 등      |

---

## 6. 네이밍 체크

- 파일: `OrdersPage.vue` (복수, 기존 결정대로)
- 컴포넌트: `CategoryTabs` (복수로 통일 — 검토 문서 피드백 반영)
- 루트 class: `orders-page` (파일명 kebab-case, [coding-guideLine.md](./coding-guideLine.md))
- 이벤트: `onClickCard`, `onIncrement` (coding-guideLine Event 규칙)
- computed: `cFilteredMenus`, `cTotalAmount` (c prefix)
- state: `selMenuCtg`, `selStore` (sel prefix)

---

## 7. 2차 작업 (이 문서 범위 밖, 참고용)

- `StoreGrid.vue` + `StoreCard.vue` — Step1 매장 선택 UI
- Step1 / Step2 / Step3 상태 분기 로직 (매장 미선택 → 선택 → 카트 담김)
- 매장 hover tooltip (Figma `2004:106 store_tooltip_example`)
- Pinia `useOrderCartStore` 로 카트 상태 승격
- API 연동 (`storesApi`, `menusApi`, `ordersApi`)
- 주문 상태 전이 정의 (검토 문서 R3)
- 세트 메뉴 플로우 (Figma 디자인 확정 후)
- 리오더 연동 — [ORDER_MGMT_PLAN.md](./ORDER_MGMT_PLAN.md) 뷰로 교체

---

## 8. 결정 기록

| 항목                      | 결정                                   | 대안                                          | 사유                                                                 |
| ------------------------- | -------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| 더미 데이터 위치          | `src/data/dummy/`                      | 페이지 내부 상수                              | API 교체 포인트 분명                                                 |
| 카트 상태                 | 페이지 `ref`                           | Pinia                                         | 1차 레이아웃 단계 — 단순 유지                                        |
| 범위                      | Step3 only                             | 3상태 전체                                    | 데이터 구조 확정 전                                                  |
| 화면 상수                 | `selStore = 세림` 고정                 | 실제 선택                                     | Step3만 구현하므로                                                   |
| 메뉴 검색 input           | UI만 배치 (로직 없음)                  | 전체 검색 구현                                | 1차 범위 밖                                                          |
| 비고 textarea             | PrimeVue Textarea                      | native                                        | 테마 일관성                                                          |
| 루트 redirect             | `/` → `/orders`                        | 이미 적용됨                                   | —                                                                    |
| 그리드 분리               | `MenuGrid` / `StoreGrid` 별도 컴포넌트 | OrdersPage inline / 제네릭 `SelectionGrid<T>` | 카드·제스처·상태 의미가 달라 분기 가시성 향상                        |
| 1차 범위에 StoreGrid 제외 | 2차로 미룸                             | Step1/2 한 번에 구현                          | 범위 작게 유지, Step3 완성 후 확장                                   |
| 리오더 구현               | 이 문서 범위 밖                        | OrdersPage 안에 내장                          | 별도 관리 페이지가 소유 ([ORDER_MGMT_PLAN.md](./ORDER_MGMT_PLAN.md)) |
