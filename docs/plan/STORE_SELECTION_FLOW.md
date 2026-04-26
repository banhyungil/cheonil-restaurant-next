# 매장 선택 → 메뉴 선택 흐름 구현 계획

> 기반 Figma: `lZH7QriZ8dnUOfNhx4D2Mr` / Step1 `19:4`, Step2 `19:227`, Step3 `19:374`
> 선행 문서: [ORDERS_PAGE_IMPL.md](./ORDERS_PAGE_IMPL.md) — 1차 (Step3 only)

## 0. 범위

1차에서 Step3 (매장 고정 + 카트 있음) 만 구현했음. 이번 단계는 **매장 미선택 → 매장 선택 → 메뉴 담기** 로 이어지는 전체 흐름을 완성.

**핵심 요구사항**

- 매장 클릭 즉시 **좌측이 StoreGrid → MenuGrid 로 자동 전환**
- **매장 헤더 (매장명 영역) 클릭 시 MenuGrid → StoreGrid 로 복귀** (매장 재선택 진입)
- 우측 카트 패널은 상태별 3가지 변형 (매장 미선택 / 메뉴 미선택 / 카트 있음)
- 리셋 버튼으로 처음 상태(매장 미선택) 로 복귀

---

## 1. 상태 머신 — 3-state

```
┌──────────────────────────┐   매장 카드 선택      ┌──────────────────────────┐
│ Step1: 매장 미선택       │ ───────────────────▶ │ Step2: 메뉴 미선택       │
│  좌: StoreGrid           │                      │  좌: MenuGrid            │
│  우: "매장을 선택하세요"  │ ◀─────────────────── │  우: "메뉴를 선택하세요" │
└──────────────────────────┘   헤더 클릭 / 리셋    └──────────────────────────┘
     ▲                                                    │   ▲
     │ 리셋 (완전 초기화)                         메뉴 담기│   │ 카트 비우기 (전부 −)
     │                                                    ▼   │
     │                                          ┌──────────────────────────┐
     └───── 헤더 클릭 + 다른 매장 선택 ────────  │ Step3: 카트 있음         │
                                                 │  좌: MenuGrid            │
                                                 │  우: 전체 카트 UI        │
                                                 └──────────────────────────┘
```

### 판단 기준

| 상태  | 조건                                    |
| ----- | --------------------------------------- |
| Step1 | `selStore == null`                      |
| Step2 | `selStore != null && cart.length === 0` |
| Step3 | `selStore != null && cart.length > 0`   |

### 주요 전이

| 트리거                      | 효과                                                                |
| --------------------------- | ------------------------------------------------------------------- |
| 매장 카드 click             | `selStore = 선택매장`. Step1 → Step2 (cart·memo 항상 유지)          |
| **헤더 매장명 click**       | `selStore = null`. Step2/Step3 → Step1. **cart·memo 유지**          |
| 메뉴 카드 click             | cart 에 추가. Step2 → Step3                                         |
| 카트 아이템 `−` 로 전부 삭제 | cart = []. Step3 → Step2                                            |
| 리셋 버튼 click (`↺`)       | **완전 초기화**: selStore = null + cart = [] + memo = ''. → Step1   |

**헤더 클릭 vs 리셋 구분**:

- 헤더 클릭 = "매장만 다시 고르고 싶음" (비파괴적) — cart 유지, 다른 매장 고르더라도 cart 유지
- 리셋 = "처음부터 다시" (파괴적) — 전부 비움
- **매장 변경은 매장만 변경** — 같은 매장이든 다른 매장이든 cart 는 건드리지 않음

---

## 2. 컴포넌트 분해

### 2.1 신규 컴포넌트

#### `src/components/card/StoreCard.vue` (빈 스텁 채움)

Figma 수치 **202×96** (메뉴 카드 202×110보다 낮음).

```ts
interface Props {
  store: Pick<Store, "seq" | "nm" | "ctgSeq">;
  category?: Pick<StoreCategory, "seq" | "nm">; // 배지 렌더용, 없으면 배지 생략
}
defineEmits<{ click: [storeSeq: number] }>();
```

내부 구조:

- 좌측: 매장명 20px Bold + ⓘ 아이콘 (22×22 원, 선택적 — 설명/상세 진입 hint)
- 우측: 카테고리 배지 pill (11px SemiBold, 카테고리별 색상)

**배지 색상**: Figma 가 카테고리마다 하드코딩 (중앙=blue, 원예=green, 외부=amber, 농협=red, 효성=blue).
→ 별도 매핑 유틸 `getStoreCategoryBadgeTone(ctgSeq | ctgNm)` 로 추출. 1차는 **`surface` 기본색 한 가지로 통일**하고, 카테고리별 색은 별도 이슈로 빼서 복잡도 낮춤.

#### `src/components/grid/StoreGrid.vue` (신규)

MenuGrid 와 구조 거의 동일. 차이:

- 검색 placeholder: **"매장 검색"**
- 카드 높이: 96px
- 그리드 5×4 (20개)
- `categories`, `stores` prop
- emit `select: [storeSeq]`

```ts
defineProps<{
  stores: readonly Store[];
  categories: readonly StoreCategory[];
}>();
defineEmits<{ select: [storeSeq: number] }>();
```

#### `src/components/panel/order-cart/CartEmptyState.vue` (신규)

Step1·Step2 모두 사용. 메시지 differ.

```ts
interface Props {
  icon?: string; // emoji or component, 기본 '🏪'
  title: string; // "매장을 선택해 주문을 시작하세요"
  description: string; // "좌측에서 주문받을 매장을 클릭하세요"
}
```

Figma:

- 아이콘 well: 96×96, radius 48, bg `surface-50`, 이모지 40px
- title: 16px SemiBold `surface-500`
- description: 13px Regular `surface-500`

### 2.2 수정 컴포넌트

#### `OrderCartPanel.vue` — 상태 분기 추가

```ts
// Props 변경
defineProps<{
  store: Pick<Store, "seq" | "nm"> | null; // null 가능
  items: CartItem[];
  memo: string;
}>();

// Emits 확장
defineEmits<{
  "update:memo": [value: string];
  increment: [menuSeq: number];
  decrement: [menuSeq: number];
  reset: []; // 완전 초기화 (리셋 버튼)
  "change-store": []; // 매장 재선택 모드 진입 (헤더 클릭)
  checkout: [];
}>();
```

내부 computed:

```ts
const cState = computed<"no-store" | "no-menu" | "has-items">(() =>
  props.store == null
    ? "no-store"
    : props.items.length === 0
      ? "no-menu"
      : "has-items",
);
```

Template 분기:
| 영역 | no-store | no-menu | has-items |
|---|---|---|---|
| Header | "미지정" (muted pill) | 매장명 (primary pill) | 매장명 (primary pill) |
| Body | `<CartEmptyState>` with 매장 msg | `<CartEmptyState>` with 메뉴 msg | 카트 리스트 + 메모 + 총액 |
| CTA | 2-line disabled (주문완료 / "매장을 선택해주세요") | 2-line disabled (주문완료 / "메뉴를 선택해주세요") | 주문완료 활성 |

CTA 2-line은 PrimeVue Button 의 default slot 으로 커스텀:

```vue
<Button :disabled="true" class="h-15 flex-col">
  <span class="text-base font-bold">주문완료</span>
  <span class="text-xs">매장을 선택해주세요</span>
</Button>
```

#### `StoreSelectHeader.vue` — 매장 미지정 variant + 클릭 재선택

```ts
defineProps<{
  storeName: string | null; // null 이면 "미지정" 표시
}>();

defineEmits<{
  "change-store": []; // 매장명 영역 클릭
  reset: []; // ↺ 버튼 클릭
}>();
```

내부 computed + 바인딩:

- `storeName == null`: bg `surface-50`, text `surface-500`, 텍스트 "미지정", cursor-default (클릭해도 이미 Step1 이라 무의미)
- `storeName != null`: bg `primary-500`, text white, **cursor-pointer + hover 피드백** — 클릭하면 `change-store` emit

리셋 버튼(↺) 은 양쪽 공통, 항상 완전 초기화.

#### `OrdersPage.vue` — 좌측 토글 + 상태 관리

```vue
<template>
  <div class="orders-page flex h-full gap-6 bg-surface-50 px-8 py-6">
    <StoreGrid
      v-if="selStore == null"
      :stores="DUMMY_STORES"
      :categories="DUMMY_STORE_CATEGORIES"
      class="flex-1"
      @select="onSelectStore"
    />
    <MenuGrid
      v-else
      :menus="DUMMY_MENUS"
      :categories="DUMMY_MENU_CATEGORIES"
      class="flex-1"
      @add="onAddMenu"
    />
    <OrderCartPanel
      v-model:memo="memo"
      :store="selStore"
      :items="cart"
      @increment="onIncrement"
      @decrement="onDecrement"
      @change-store="onChangeStore"
      @reset="onResetAll"
      @checkout="onCheckout"
    />
  </div>
</template>
```

핸들러 변경:

```ts
const selStore = ref<Store | null>(null); // 초기값 null (Step1)
const cart = ref<CartItem[]>([]); // 초기값 빈 배열
const prevStoreSeq = ref<number | null>(null); // change-store 직전 매장 seq 기억

function onSelectStore(storeSeq: number) {
  const store = DUMMY_STORES.find((s) => s.seq === storeSeq);
  if (!store) return;

  // 매장이 바뀌면 cart 비움 (이전 컨텍스트는 다른 매장 용)
  if (prevStoreSeq.value != null && prevStoreSeq.value !== storeSeq) {
    cart.value = [];
    memo.value = "";
  }
  prevStoreSeq.value = null;

  selStore.value = store; // v-if 자동 전환
}

function onChangeStore() {
  // 매장 재선택 모드 진입 — 현재 매장 기억하고 Step1 으로
  prevStoreSeq.value = selStore.value?.seq ?? null;
  selStore.value = null;
  // cart / memo 는 유지 — 같은 매장 재선택 시 이어감
}

function onResetAll() {
  selStore.value = null;
  prevStoreSeq.value = null;
  cart.value = [];
  memo.value = "";
}
```

---

## 3. Figma 수치 요약

### StoreCard (Step1)

| 속성          | 값                                    | 토큰                                 |
| ------------- | ------------------------------------- | ------------------------------------ |
| 크기          | 202×96                                | —                                    |
| 배경          | `#ffffff`                             | `surface-0`                          |
| 테두리        | `1px #e0e5eb`                         | `surface-200`                        |
| radius        | 10px                                  | —                                    |
| padding       | px-5 py-3.5 (Figma 기준)              | `px-5 py-3.5`                        |
| 매장명        | 20px Bold `#212933`                   | `text-xl font-bold text-surface-900` |
| ⓘ 아이콘      | 22×22 원, bg `#edf5ff`                | `bg-blue-50` — 1차 생략 가능         |
| 카테고리 배지 | h-6 rounded-xl px-2.5 / 11px SemiBold | —                                    |

### 카트 패널 empty state (Step1 우측)

| 요소         | 값                           | 토큰                                     |
| ------------ | ---------------------------- | ---------------------------------------- |
| 아이콘 well  | 96×96 원 bg `#f7fafa`        | `surface-50`                             |
| 이모지       | 40px                         | `text-4xl`                               |
| title        | 16px SemiBold `#73808c`      | `text-lg font-semibold text-surface-500` |
| desc         | 13px Regular `#73808c`       | `text-base text-surface-500`             |
| disabled CTA | bg `#dbede5` (muted primary) | —                                        |

### 매장 카테고리

DDL `m_store_category` + 더미 이미 8개 정의됨 ([src/data/dummy/stores.ts](../src/data/dummy/stores.ts)). Figma Step1 의 9개 탭은 "전체" 가상 탭 포함 — OrdersPage 에서 StoreGrid 가 자동 주입 (MenuGrid 와 동일 패턴).

---

## 4. 구현 순서

각 단계 끝나면 브라우저로 Step1/Step2/Step3 전환 확인.

1. **StoreCard.vue** 채움 (배지 색상은 `surface` 기본 단일색 — 카테고리별 색 2차)
2. **StoreGrid.vue** 신규 — MenuGrid 복사 후 Menu → Store 치환
3. **CartEmptyState.vue** 신규
4. **StoreSelectHeader.vue** 수정 — `storeName: string | null` 허용 + `change-store` emit (매장명 영역 클릭)
5. **OrderCartPanel.vue** 수정 — `store: ... | null`, 3-state 분기, `cState` computed, `change-store` emit 포워딩
6. **OrdersPage.vue** 수정 — `selStore = null` 초기값, `v-if` 토글, `onSelectStore` / `onChangeStore` / `onResetAll`, `prevStoreSeq` 추적

---

## 5. 타입 확장

새 타입 불필요. 기존 `Store`, `StoreCategory` 활용.

`OrderCartPanel` 의 store prop 만 nullable 로 변경:

```ts
store: Pick<Store, "seq" | "nm"> | null;
```

---

## 6. 결정 기록

| 항목                         | 결정                                    | 대안                          | 사유                                                                     |
| ---------------------------- | --------------------------------------- | ----------------------------- | ------------------------------------------------------------------------ |
| 매장 선택 후 전환            | **자동** (selStore 값 변경 → v-if)      | 버튼으로 명시 전환            | POS UX 원칙 — 클릭 하나로 진행                                           |
| 헤더 매장명 클릭             | **매장 재선택 모드** (Step1 복귀, cart 유지) | 완전 초기화 (리셋과 동일)     | 리셋과 구분, 비파괴적 네비게이션                                         |
| 매장 재선택 시 cart 처리     | **항상 유지** (매장만 변경)             | 다른 매장이면 cart 비움       | 매장 변경이 cart 를 건드리지 않는다는 단순한 멘탈 모델                   |
| 리셋 버튼 동작               | **완전 초기화** (매장 + cart + memo)    | 카트만 비움                   | 리셋 = "처음부터 다시" 멘탈 모델                                         |
| StoreCard 배지 색            | 1차는 단일 `surface` 색                 | 카테고리별 색 매핑            | 복잡도 낮춤, 카테고리 색은 2차 (`getStoreCategoryBadgeTone` 유틸로 분리) |
| empty state 컴포넌트         | **공통 `CartEmptyState`**               | 상태별 다른 컴포넌트          | 메시지/아이콘만 다르고 레이아웃 동일                                     |
| CTA 2-line disabled          | **PrimeVue Button default slot** 커스텀 | 별도 컴포넌트                 | 한 곳에서만 쓰이는 variant                                               |
| `selStore` 타입              | `Store \| null`                         | default Store 로 항상 값 유지 | `null` 이 "미선택" 을 명확히 표현                                        |
| StoreGrid vs MenuGrid 공통화 | **별도 컴포넌트로 유지**                | 제네릭 `SelectionGrid<T>`     | 내부 상태/emit 이름이 서로 달라 분기 가시성 ↑                            |

---

## 7. 2차 작업 (이 문서 범위 밖)

- 매장 카테고리별 배지 색상 매핑 (`getStoreCategoryBadgeTone`)
- 매장 카드 hover tooltip (Figma `2004:106 store_tooltip_example`) — ⓘ 아이콘 hover
- 매장 검색 input 실제 필터링 로직
- Pinia `useOrderDraftStore` 로 selStore + cart + memo 승격 (라우트 이동 후 복귀 시 유지)
