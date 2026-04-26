# OrdersPage 2차 구현 계획

> 선행 문서: [ORDERS_PAGE_IMPL.md](./ORDERS_PAGE_IMPL.md), [STORE_SELECTION_FLOW.md](./STORE_SELECTION_FLOW.md)
> 1차에서 Step1/2/3 전환 포함한 UI·동작은 완성. 이번 단계는 **데이터·UX 완성도** 단계.

---

## 0. 범위 및 목표

| # | 항목 | 우선순위 | 의존성 |
|---|---|---|---|
| 1 | Pinia `useOrderDraftStore` 로 상태 승격 | 높음 | 없음 |
| 2 | 백엔드 API 연결 (dummy → 실제) | 높음 | 백엔드 진행도 |
| 3 | 매장/메뉴 검색 실제 필터링 | 중 | 없음 |
| 4 | 매장 카드 카테고리별 배지 색상 | 낮음 | 없음 |
| 5 | 매장 카드 hover tooltip (ⓘ) | 낮음 | floating-vue 또는 PrimeVue Popover |
| 6 | 세트 메뉴 플로우 | 낮음 | 🔴 Figma 디자인 부재 (blocking) |

각 항목은 독립적으로 구현 가능. 1 → 2 순서가 자연스러움 (상태 구조 먼저).

---

## 1. Pinia `useOrderDraftStore` 승격

### 현재 상태
- [OrdersPage.vue](../src/pages/OrdersPage.vue) 내부 `ref` 3개: `selStore`, `cart`, `memo`
- 다른 라우트로 이동 후 복귀 시 전부 초기화 → 주문 작성 중단 시 데이터 증발

### 목표
- 주문 작성 중 상태를 **라우트 이동 후에도 유지**
- Pinia DevTools 의 **mutation timeline / time-travel** 디버깅 활용
- 다른 컴포넌트에서도 카트 조회 가능 (예: AppSidebar 에 "카트 N건" 뱃지 — 나중에)

### 설계

파일 위치: `src/stores/orderDraftStore.ts`

```ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { CartItem } from '@/types/cart'
import type { Store } from '@/types/store'

export const useOrderDraftStore = defineStore(
  'orderDraft',
  () => {
    const selStore = ref<Store | null>(null)
    const cart = ref<CartItem[]>([])
    const memo = ref('')

    const cTotalCount = computed(() => cart.value.reduce((s, i) => s + i.cnt, 0))
    const cTotalAmount = computed(() => cart.value.reduce((s, i) => s + i.price * i.cnt, 0))
    const cIsEmpty = computed(() => cart.value.length === 0)

    function selectStore(store: Store) {
      selStore.value = store
    }

    function changeStore() {
      selStore.value = null
      // cart/memo 는 유지
    }

    function addMenu(menu: { seq: number; nm: string; price: number }) {
      const existing = cart.value.find((i) => i.menuSeq === menu.seq)
      if (existing) {
        existing.cnt++
        return
      }
      cart.value.push({ menuSeq: menu.seq, nm: menu.nm, price: menu.price, cnt: 1 })
    }

    function incrementCart(menuSeq: number) {
      const item = cart.value.find((i) => i.menuSeq === menuSeq)
      if (item) item.cnt++
    }

    function decrementCart(menuSeq: number) {
      const idx = cart.value.findIndex((i) => i.menuSeq === menuSeq)
      if (idx === -1) return
      cart.value[idx]!.cnt--
      if (cart.value[idx]!.cnt <= 0) cart.value.splice(idx, 1)
    }

    function setMemo(v: string) {
      memo.value = v
    }

    function resetAll() {
      selStore.value = null
      cart.value = []
      memo.value = ''
    }

    return {
      selStore,
      cart,
      memo,
      cTotalCount,
      cTotalAmount,
      cIsEmpty,
      selectStore,
      changeStore,
      addMenu,
      incrementCart,
      decrementCart,
      setMemo,
      resetAll,
    }
  },
  {
    persist: true, // pinia-plugin-persistedstate 적용 — 브라우저 재실행해도 유지
  },
)
```

### 영향 범위

#### [OrdersPage.vue](../src/pages/OrdersPage.vue)
- `ref` 3개 제거, `useOrderDraftStore()` 로 교체
- 핸들러 함수들은 store 메서드 호출로 교체
- template 바인딩은 store state 를 참조

```ts
// Before
const cart = ref<CartItem[]>([])
function onAddMenu(menuSeq: number) { ... }

// After
const orderDraft = useOrderDraftStore()
const { cart, memo, selStore, cTotalCount, cTotalAmount } = storeToRefs(orderDraft)
function onAddMenu(menuSeq: number) {
  const menu = DUMMY_MENUS.find(m => m.seq === menuSeq)
  if (menu) orderDraft.addMenu(menu)
}
```

#### [OrderCartPanel.vue](../src/components/panel/order-cart/OrderCartPanel.vue)
- 영향 없음 — props 기반 컴포넌트. OrdersPage 가 store 값을 그대로 주입

### 고려사항

**persist 설정**:
- `persist: true` 만 쓰면 전체 state 가 localStorage 에 저장
- 특정 필드만 persist 하려면 `persist: { paths: ['selStore', 'cart', 'memo'] }` 같이 지정 (이 케이스에선 전부 저장해도 됨)
- 민감 정보(결제 정보 등) 는 peristed 에서 제외

**hydration 타이밍**:
- `persist` 는 앱 기동 시 자동 복원
- 복원 전 UI 가 잠깐 빈 상태로 깜빡일 수 있음 — 필요 시 `onHydrated` 콜백 또는 splash 처리

**cart 초기 하드코딩 제거**:
- 현재 OrdersPage 에 `{ menuSeq: 1, nm: '돈까스', ... }` 등 초기값 있음 — 1차 demo 용. Pinia 승격 시 빈 배열로 시작.

---

## 2. 백엔드 API 연결

### 현재 상태
- [menusApi.ts](../src/apis/menusApi.ts), [storesApi.ts](../src/apis/storesApi.ts) — 함수 시그니처는 최종형, 내부는 dummy 반환
- OrdersPage 는 `DUMMY_MENUS`, `DUMMY_STORES` 직접 import

### 목표
- API 호출로 전환, dummy 의존 제거
- 로딩 / 에러 상태 처리
- 카테고리 + 상품 리스트는 **한 번 로드 후 캐싱** (자주 바뀌지 않음)

### 설계

#### API 호출부 전환

```ts
// menusApi.ts — dummy 분기 제거
import { api } from './api'

export async function fetchList(): Promise<Menu[]> {
  return api.get<Menu[]>('/menus').then((r) => r.data)
}
// fetchById, fetchCategoryList 동일
```

백엔드 엔드포인트 계약:
- `GET /api/menus` → `Menu[]`
- `GET /api/menus/:seq` → `Menu`
- `GET /api/menu-categories` → `MenuCategory[]`
- 동일 패턴: stores, store-categories

응답 JSON 은 **camelCase** (ctgSeq, nmS, regAt 등). 백엔드가 snake_case 변환해서 serialize 해야 함.

#### OrdersPage 에서 로딩

```ts
import { onMounted, ref } from 'vue'
import * as menusApi from '@/apis/menusApi'
import * as storesApi from '@/apis/storesApi'

const menus = ref<Menu[]>([])
const menuCategories = ref<MenuCategory[]>([])
const stores = ref<Store[]>([])
const storeCategories = ref<StoreCategory[]>([])

const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const [m, mc, s, sc] = await Promise.all([
      menusApi.fetchList(),
      menusApi.fetchCategoryList(),
      storesApi.fetchList(),
      storesApi.fetchCategoryList(),
    ])
    menus.value = m
    menuCategories.value = mc
    stores.value = s
    storeCategories.value = sc
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    isLoading.value = false
  }
})
```

#### 로딩 UI

```vue
<template>
  <div v-if="isLoading" class="flex h-full items-center justify-center">
    <ProgressSpinner />  <!-- PrimeVue -->
  </div>
  <div v-else-if="error" class="...">
    <p>{{ error }}</p>
    <BButton @click="retry">다시 시도</BButton>
  </div>
  <div v-else class="orders-page ...">
    <!-- 기존 UI -->
  </div>
</template>
```

### 캐싱 전략

**선택지**:
- (A) **단순 onMounted 로딩** — 페이지 진입마다 로딩. 간단.
- (B) **Pinia store 에 저장** — 앱 생애 동안 한 번만 로드. `useMenusStore`, `useStoresStore` 별도 생성.
- (C) **TanStack Query (vue-query)** — 캐싱·재검증·mutations 통합. 라이브러리 추가.

**권장 (B)**:
- 메뉴/매장 리스트는 페이지 전환 시 불변 — 매번 재로딩 불필요
- Pinia store 가 이미 있음 (orderDraft)
- `menusStore.ensureLoaded()` 로 멱등 fetch

```ts
// src/stores/menusStore.ts
export const useMenusStore = defineStore('menus', () => {
  const menus = ref<Menu[]>([])
  const categories = ref<MenuCategory[]>([])
  const isLoaded = ref(false)

  async function ensureLoaded() {
    if (isLoaded.value) return
    const [m, c] = await Promise.all([
      menusApi.fetchList(),
      menusApi.fetchCategoryList(),
    ])
    menus.value = m
    categories.value = c
    isLoaded.value = true
  }

  function invalidate() {
    isLoaded.value = false
  }

  return { menus, categories, isLoaded, ensureLoaded, invalidate }
})
```

관리 페이지(MenusPage) 에서 메뉴 수정 시 `invalidate()` 호출 → OrdersPage 다음 진입 시 재로딩.

### 영향 범위
- [menusApi.ts](../src/apis/menusApi.ts), [storesApi.ts](../src/apis/storesApi.ts) — dummy 제거 후 실제 호출
- [OrdersPage.vue](../src/pages/OrdersPage.vue) — 로딩 / 에러 UI 추가, dummy import 제거
- 신규: `src/stores/menusStore.ts`, `src/stores/storesStore.ts`

### 고려사항
- `src/data/dummy/` — 지울지 유지할지. **유지 추천** (테스트·MSW·Storybook 시 사용)
- axios 인터셉터의 공통 에러 처리 ([api.ts](../src/apis/api.ts)) 와 페이지별 에러 처리 경계 명확화 필요

---

## 3. 매장/메뉴 검색 실제 필터링

### 현재 상태
- [MenuGrid.vue](../src/components/grid/MenuGrid.vue), [StoreGrid.vue](../src/components/grid/StoreGrid.vue) 에 `searchKeyword` ref 존재
- InputText v-model 은 연결되어 있으나 **filter 에 반영 안 됨**

### 설계

양 그리드 공통 패턴:

```ts
const cFilteredMenus = computed(() => {
  const byCategory =
    selCtg.value === ALL_CTG_SEQ
      ? props.menus
      : props.menus.filter((m) => m.ctgSeq === selCtg.value)

  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return byCategory
  return byCategory.filter((m) => m.nm.toLowerCase().includes(keyword))
})
```

### 한글 초성 검색 (선택)

`hangul-util` 이미 설치됨 ([package.json:27](../package.json#L27)).

```ts
import { getChoseong, includes } from 'hangul-util'

// 예: 사용자가 "ㄱㅊ" 입력 → "김치찌개" 매칭
const keyword = searchKeyword.value.trim()
if (!keyword) return byCategory
return byCategory.filter((m) => {
  // 일반 문자열 매칭
  if (m.nm.includes(keyword)) return true
  // 초성 매칭
  if (getChoseong(m.nm).includes(keyword)) return true
  return false
})
```

POS 환경에서 **초성 검색**은 빠른 입력에 유리. 권장.

### 디바운스 (선택)

데이터가 작음 (메뉴 15, 매장 12) → 불필요.
데이터 크기가 수백 이상으로 커지면 `@vueuse/core` 의 `useDebounce`:

```ts
import { refDebounced } from '@vueuse/core'

const searchKeyword = ref('')
const debouncedKeyword = refDebounced(searchKeyword, 150)
// computed 에서 debouncedKeyword 참조
```

### 영향 범위
- [MenuGrid.vue](../src/components/grid/MenuGrid.vue) — `cFilteredMenus` 로직 확장
- [StoreGrid.vue](../src/components/grid/StoreGrid.vue) — `cFilteredStores` 로직 확장
- 신규 유틸 (초성 매칭 쓰면): `src/utils/search.ts` 에 공통 함수 추출

---

## 4. 매장 카드 카테고리별 배지 색상

### 현재 상태
- [StoreCard.vue](../src/components/card/StoreCard.vue) 배지: 전부 `bg-surface-100 text-surface-700` 단일색
- Figma: 카테고리마다 다른 색상 (중앙=blue, 원예=green, 외부=amber, 농협=red, 효성=blue)

### 설계

`src/utils/storeCategoryTone.ts`:

```ts
type BadgeTone = {
  bg: string
  text: string
}

const TONE_MAP: Record<string, BadgeTone> = {
  중앙: { bg: 'bg-blue-50', text: 'text-blue-600' },
  농협: { bg: 'bg-red-50', text: 'text-red-600' },
  대양: { bg: 'bg-amber-50', text: 'text-amber-600' },
  원예: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  외부: { bg: 'bg-orange-50', text: 'text-orange-600' },
  효성: { bg: 'bg-blue-50', text: 'text-blue-600' },
  글로벌: { bg: 'bg-violet-50', text: 'text-violet-600' },
  관련상가: { bg: 'bg-slate-50', text: 'text-slate-600' },
}

const DEFAULT_TONE: BadgeTone = { bg: 'bg-surface-100', text: 'text-surface-700' }

export function getStoreCategoryTone(categoryName: string | undefined): BadgeTone {
  if (!categoryName) return DEFAULT_TONE
  return TONE_MAP[categoryName] ?? DEFAULT_TONE
}
```

[StoreCard.vue](../src/components/card/StoreCard.vue) 사용:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { getStoreCategoryTone } from '@/utils/storeCategoryTone'

const props = defineProps<{ ... }>()

const cTone = computed(() => getStoreCategoryTone(props.categoryName))
</script>

<template>
  ...
  <span
    v-if="categoryName"
    :class="['flex h-6 items-center rounded-xl px-2.5 text-sm font-semibold', cTone.bg, cTone.text]"
  >
    {{ categoryName }}
  </span>
  ...
</template>
```

### 고려사항
- **카테고리 이름 기반 매핑**: 카테고리 seq 가 DB 재생성 시 바뀔 수 있으므로 이름 기반이 안전
- **테마 토큰 확장 고려**: 배지 색 5~6개가 정기적으로 쓰이면 `theme.css` 에 `--color-badge-blue` 같은 alias 추가도 가능
- **새 카테고리 추가 시**: TONE_MAP 에 없으면 DEFAULT_TONE 사용 — graceful fallback

---

## 5. 매장 카드 hover tooltip (ⓘ)

### 현재 상태
- StoreCard 에 ⓘ 아이콘 없음 (1차 생략)
- Figma: `2004:106 store_tooltip_example` — hover 시 매장 상세 (주소, 연락처 등)

### 설계

#### ⓘ 아이콘 추가

[StoreCard.vue](../src/components/card/StoreCard.vue):

```vue
<div class="flex items-center gap-2">
  <span class="text-xl font-bold text-surface-900">{{ store.nm }}</span>
  <button
    v-if="hasDetails"
    type="button"
    class="flex size-5 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-bold"
    @click.stop
  >
    ⓘ
  </button>
</div>
```

`@click.stop` — 아이콘 클릭 시 카드 select 막음.

#### Tooltip 라이브러리 선택

(A) **floating-vue** — 이미 설치됨 ([package.json:26](../package.json#L26))
```vue
<VTooltip>
  <button class="...">ⓘ</button>
  <template #popper>
    <div class="store-detail">
      <p>{{ store.addr }}</p>
      <p>{{ store.cmt }}</p>
    </div>
  </template>
</VTooltip>
```

(B) **PrimeVue Popover** — PrimeVue 일관성 유지 가능. 다만 trigger 설정 약간 번거로움.

**권장 (A) floating-vue** — 이미 설치되어 있고 tooltip 에 최적화됨.

#### Tooltip 내용

Figma 기준:
- 매장명 / 주소 / 비고 (cmt)
- 추가로: 등록일, 담당자 등 (DDL `m_store` 참고)

```vue
<div class="flex flex-col gap-2 p-3 min-w-56">
  <p class="text-base font-semibold text-surface-900">{{ store.nm }}</p>
  <p v-if="store.addr" class="text-sm text-surface-600">📍 {{ store.addr }}</p>
  <p v-if="store.cmt" class="text-sm text-surface-500">{{ store.cmt }}</p>
</div>
```

### 영향 범위
- [StoreCard.vue](../src/components/card/StoreCard.vue) — 템플릿 확장, floating-vue 사용
- [main.ts](../src/main.ts) — `import 'floating-vue/dist/style.css'` + `app.use(FloatingVue)` 필요

### 고려사항
- **hasDetails 판정**: `store.addr || store.cmt` 존재 여부. 내용 없는 매장엔 ⓘ 숨김
- **모바일/터치**: hover 안 통함 → tap-to-show, 다시 tap 하면 닫기

---

## 6. 세트 메뉴 플로우

### 🔴 Blocking
- Figma 디자인 부재 — [ORDER_PAGES_REVIEW.md](./ORDER_PAGES_REVIEW.md) 3.1 항목

### 필요한 것
디자이너 결정:
- 세트 메뉴를 단품처럼 한 번에 담는 방식 vs 다이얼로그로 구성 선택 방식
- 세트 안의 메뉴들을 어떻게 표시할지 (수량 조절 가능 여부)
- 가격 계산 룰 (세트 할인 등)

### 구조 추정 (디자인 확정 전 참고)

**Option A: Dialog 기반 구성 선택**
```
메뉴 그리드에서 "세트메뉴 A" 클릭
  → Dialog 열림
     - 세트 구성: "식사 1개 + 찌개 1개 + 음료 1개"
     - 각 항목별 선택 가능한 메뉴 리스트
     - 전체 선택 후 "카트에 담기" → Dialog 닫히고 cart 에 추가
```

**Option B: 단품 담기 + 후처리**
```
메뉴 그리드에서 세트 구성 메뉴들을 단품처럼 담음
  → cart 에 자동으로 "세트 할인" 라인 추가
  → 총액 차감
```

A 가 POS UX 에 일반적. **디자이너 확정 후 별도 문서** 로 분리 예정.

### DB 준비
`m_menu.options` (jsonb) 에 세트 여부 / 구성 저장 가능. 또는 별도 `m_menu_set`, `m_menu_set_slot` 테이블.

---

## 7. 구현 순서 (제안)

독립성 기준으로 정렬:

1. **매장/메뉴 검색 필터링** (#3) — 작고 즉시 효과. 15분
2. **매장 카드 배지 색상** (#4) — 유틸 하나, StoreCard 수정. 20분
3. **Pinia 승격** (#1) — 상태 구조 먼저 다지기. 1시간
4. **백엔드 API 연결** (#2) — 백엔드 준비도에 따라. 2~4시간
5. **매장 hover tooltip** (#5) — floating-vue 설정 + UI. 30분
6. **세트 메뉴** (#6) — 🔴 디자인 확정 후

**1~2 먼저** 하면 사용자 경험이 즉시 개선됨. **3~4** 는 장기 유지보수 기반.

---

## 8. 결정 기록

| 항목 | 결정 | 대안 | 사유 |
|---|---|---|---|
| Pinia persist | `persist: true` 전체 | 선택 필드만 | 카트·메모·매장 모두 복구 필요 |
| API 캐싱 | Pinia store (`ensureLoaded` 패턴) | TanStack Query / 매번 재로딩 | 의존성 추가 없음, 데이터 불변성 활용 |
| 초성 검색 | `hangul-util` 기반 | 정확 매칭만 | POS 빠른 입력 UX |
| 검색 debounce | 생략 (데이터 작음) | `@vueuse/core` useDebounce | 오버엔지니어링 회피 |
| 배지 색상 매핑 | 카테고리 이름 기반 | seq 기반 | DB 재생성 시 seq 변동 대비 |
| tooltip 라이브러리 | `floating-vue` | PrimeVue Popover | 이미 설치, 전용 설계 |
| ⓘ 아이콘 | 1차엔 store.addr/cmt 있을 때만 | 항상 표시 | 빈 tooltip 회피 |
| 세트 메뉴 | 🔴 blocked | — | Figma 디자인 필요 |

---

## 9. 2차 이후 (3차 이상)

- OrdersMonitorPage 와 연계: 주문완료 시 Pinia store 초기화 + Monitor 로 데이터 흘러가는 파이프
- `useOrderDraftStore` 에 `submit()` 메서드 추가 — 백엔드 `POST /api/orders` 호출
- 세트 메뉴 (디자인 확정 후)
- 모바일/태블릿 반응형
- 접근성 (aria-live for cart 변경, 키보드 네비)
