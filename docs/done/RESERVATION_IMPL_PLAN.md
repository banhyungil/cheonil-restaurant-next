# 예약 시스템 구현 방안 (프론트엔드)

> 단골 반복 예약(템플릿) + 일회성 예약 + 예약 → 주문 전환 흐름.
> 관련 테이블: `m_order_rsv_tmpl`, `m_order_rsv_menu`, `t_order_rsv`, `t_order_rsv_menu`, `t_order.rsv_seq`.
> 백엔드 미구현 — 본 문서는 **프론트엔드 우선 구현**을 위한 계획. API 시그니처를 먼저 확정해 mock 으로 진행하고, 백엔드 완성 후 mock 만 교체한다.

---

## 1. 핵심 원칙 (이전 세션에서 결정 — 그대로 유지)

1. **템플릿 → 인스턴스 자동 생성은 SSE push** (백엔드 cron 이 `t_order_rsv` 생성 → 푸시. 프론트 polling 없음)
2. **예약 접수 = `t_order` 생성** — 접수 시 주문 엔티티가 함께 만들어짐
3. **예약 페이지는 주문현황과 동일한 2단 구조**: 진행 중 / 처리 이력
4. **당일 예약 중심** — 기본 `당일` 탭, `모두` 탭으로 확장
5. **예약/템플릿 생성 시 좌측 매장 → 메뉴 흐름은 OrdersPage 와 동일**, 우측 패널만 차이
6. **처리 이력 복구**: 1시간 이내만 가능 (초과 시 [복구] 버튼 비활성)
7. **COMPLETED → RESERVED 복구 시**: 연결된 `t_order` 같이 삭제
8. **템플릿 편집은 기존 인스턴스에 영향 없음** (snapshot)
9. **취소는 `CANCELED` 상태로** 기록 (물리 삭제 X)
10. **템플릿 비활성/종료** 둘 다 사용 — `active=false` 즉시 중단, `end_dt` 예정된 종료

---

## 2. 페이지 / 라우트 구성

| 그룹 | 파일                        | 라우트                        | 비고                                              |
| ---- | --------------------------- | ----------------------------- | ------------------------------------------------- |
| 영업 | `OrderRsvsPage.vue`         | `/order-rsvs`                 | 진행 중 + 처리 이력 (메인) ✅ 라우트 존재         |
| 영업 | `OrderRsvsEditPage.vue`     | `/order-rsvs/edit`            | **생성/수정 통합 페이지** (매장→메뉴→예약정보) 🆕 |
| 관리 | `OrderRsvTmplsPage.vue`     | `/reservation-templates`      | 템플릿 목록 + 통계 ✅ 라우트 존재                 |
| 관리 | `OrderRsvTmplsEditPage.vue` | `/reservation-templates/edit` | **템플릿 생성/수정 통합 페이지** 🆕               |

- 라우트 추가는 [src/router/routes.ts](../../src/router/routes.ts) 에 보강. 사이드바에는 노출하지 않는다 (서브 라우트).
- **생성·수정 모드 분기는 라우트가 아닌 store 의 `editingSeq` 로** ([OrdersPage 패턴](../flows/ORDER_EDIT_FLOW.md) 동일). 진입측에서 store 에 hydrate 후 `router.push` → 편집 페이지가 store 구독해 자동 표시.
- 저장 후 `router.push('/order-rsvs')` (또는 `/reservation-templates`) 로 자동 복귀.

---

## 3. 데이터 레이어

### 3-1. 타입 ([src/types/reservation.ts](../../src/types/reservation.ts) 신규)

```ts
export type RsvStatus = "RESERVED" | "COMPLETED" | "CANCELED";
export type DayType = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

/** t_order_rsv 인스턴스 */
export interface OrderRsv {
  seq: number;
  storeSeq: number;
  rsvTmplSeq?: number | null; // null = 일회성
  amount: number;
  rsvAt: string; // ISO
  status: RsvStatus;
  cmt?: string | null; // 백엔드 컬럼은 옵션 — 필요 시 추가
  regAt: string;
  modAt: string;
}

/** t_order_rsv_menu */
export interface OrderRsvMenu {
  menuSeq: number;
  rsvSeq: number;
  price: number;
  cnt: number;
}

export interface OrderRsvMenuExt extends OrderRsvMenu {
  menuNm: string;
  menuNmS?: string | null;
}

/** 예약 카드용 aggregate (t_order_rsv + m_store + t_order_rsv_menu + m_menu) */
export interface OrderRsvExt extends OrderRsv {
  storeNm: string;
  storeCmt?: string | null;
  tmplNm?: string | null; // 템플릿 유래일 때만
  menus: OrderRsvMenuExt[];
  /** 처리완료/취소된 시각 (status 변경 시각 = modAt). 처리 이력에서 사용. */
  processedAt?: string | null;
}

/** m_order_rsv_tmpl */
export interface OrderRsvTmpl {
  seq: number;
  storeSeq: number;
  nm: string;
  amount: number;
  rsvTime: string; // 'HH:mm:ss'
  dayTypes: DayType[];
  cmt?: string | null;
  active: boolean;
  startDt?: string | null;
  endDt?: string | null;
  regAt: string;
  modAt: string;
}

export interface OrderRsvTmplMenu {
  menuSeq: number;
  rsvTmplSeq: number;
  price: number;
  cnt: number;
}

/** 템플릿 목록용 aggregate */
export interface OrderRsvTmplExt extends OrderRsvTmpl {
  storeNm: string;
  menus: (OrderRsvTmplMenu & { menuNm: string })[];
}
```

### 3-2. API ([src/apis/orderRsvsApi.ts](../../src/apis/orderRsvsApi.ts), [src/apis/orderRsvTmplsApi.ts](../../src/apis/orderRsvTmplsApi.ts) 신규)

`ordersApi` 패턴 그대로. 백엔드 미구현 동안에는 함수 본체를 mock 데이터 반환으로 채우고, 시그니처만 확정.

```ts
// orderRsvsApi.ts
export interface RsvsListParams {
  statuses?: RsvStatus[];
  dayMode?: "TODAY" | "ALL";
  storeSeq?: number;
}

export interface RsvCreatePayload {
  storeSeq: number;
  rsvAt: string; // ISO
  cmt?: string;
  menus: Pick<OrderRsvMenu, "menuSeq" | "price" | "cnt">[];
}
export type RsvUpdatePayload = RsvCreatePayload;

export type RsvStatusChangeResult = Pick<OrderRsv, "seq" | "status" | "modAt">;

export async function fetchList(p?: RsvsListParams): Promise<OrderRsvExt[]>;
export async function create(p: RsvCreatePayload): Promise<OrderRsvExt>;
export async function update(
  seq: number,
  p: RsvUpdatePayload,
): Promise<OrderRsvExt>;
export async function updateStatus(
  seq: number,
  status: RsvStatus,
): Promise<RsvStatusChangeResult>;
export async function remove(seq: number): Promise<void>;
```

```ts
// orderRsvTmplsApi.ts
export interface RsvTmplsListParams {
  storeSeq?: number;
  dayType?: DayType;
  active?: boolean;
}

export interface RsvTmplCreatePayload {
  storeSeq: number;
  nm: string;
  rsvTime: string;
  dayTypes: DayType[];
  startDt?: string;
  endDt?: string | null;
  cmt?: string;
  active: boolean;
  menus: Pick<OrderRsvTmplMenu, "menuSeq" | "price" | "cnt">[];
}
export type RsvTmplUpdatePayload = RsvTmplCreatePayload;

export async function fetchList(
  p?: RsvTmplsListParams,
): Promise<OrderRsvTmplExt[]>;
export async function fetchById(seq: number): Promise<OrderRsvTmplExt>;
export async function create(p: RsvTmplCreatePayload): Promise<OrderRsvTmplExt>;
export async function update(
  seq: number,
  p: RsvTmplUpdatePayload,
): Promise<OrderRsvTmplExt>;
export async function patchActive(seq: number, active: boolean): Promise<void>;
export async function remove(seq: number): Promise<void>;

/** 템플릿 페이지 통계용 — 별도 엔드포인트 또는 list 에서 derive. 일단 derive */
export interface RsvTmplStats {
  total: number;
  active: number;
  inactive: number;
  generatedToday: number;
}
```

### 3-3. Query ([src/queries/orderRsvsQuery.ts](../../src/queries/orderRsvsQuery.ts), [src/queries/orderRsvTmplsQuery.ts](../../src/queries/orderRsvTmplsQuery.ts) 신규)

```ts
// queryKeys.ts 에 추가
orderRsvs: ['orderRsvs'] as const,
orderRsvsMonitor: ['orderRsvs', 'monitor'] as const,   // 진행중 + 1시간 이내 처리이력
orderRsvTmpls: ['orderRsvTmpls'] as const,
```

- `useOrderRsvsMonitorQuery(dayMode)` — `{ ready: OrderRsvExt[], history: OrderRsvExt[] }` 형태로 select. RESERVED 전체 + 1시간 이내 COMPLETED/CANCELED.
- `useOrderRsvTmplsQuery(filters)` / `useOrderRsvTmplStatsQuery()` (list 에서 derive)
- mutation: create / update / status / remove — **`onSuccess` 에서 `queryClient.invalidateQueries(QUERY_KEYS.orderRsvsMonitor)` 직접 호출**. (※ ordersQuery 와 정책이 다름 — §3-4 참조)

### 3-4. SSE 스트림 ([src/composables/useOrderRsvStream.ts](../../src/composables/useOrderRsvStream.ts) 신규)

> **범위 축소**: 예약 도메인의 SSE 는 **백엔드 cron 이 템플릿에서 자동 생성한 인스턴스를 push 받는 용도 1건만** 담당.
> 사용자 액션으로 발생하는 변경 (수동 생성/수정/상태변경/삭제) 은 mutation 의 `onSuccess` invalidate 로 갱신.

| 이벤트        | 발생 조건                                                           | 처리                  |
| ------------- | ------------------------------------------------------------------- | --------------------- |
| `rsv:created` | 백엔드 cron 이 템플릿의 `rsvTime` 도달 시 `t_order_rsv` 자동 INSERT | monitor 캐시에 append |

처리하지 않는 것:

- `rsv:updated` / `rsv:status-changed` / `rsv:removed` — 모두 mutation 의 invalidate 로 충분
- 멀티 탭/멀티 사용자 동시 편집 시 다른 탭의 사용자 액션은 stale — 새로고침 또는 다음 mutation 으로 보정 (현재 단일 운영자 가정)

```ts
// useOrderRsvStream.ts (skeleton)
export function useOrderRsvStream() {
  const queryClient = useQueryClient();
  let eventSource: EventSource | null = null;

  onMounted(() => {
    eventSource = new EventSource("/api/order-rsvs/stream");

    eventSource.addEventListener("rsv:created", (e) => {
      const rsv = JSON.parse((e as MessageEvent<string>).data) as OrderRsvExt;
      queryClient.setQueryData<{
        ready: OrderRsvExt[];
        history: OrderRsvExt[];
      }>(QUERY_KEYS.orderRsvsMonitor, (old) =>
        old ? { ...old, ready: [...old.ready, rsv] } : old,
      );
    });

    eventSource.onopen = () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orderRsvsMonitor });
  });

  onBeforeUnmount(() => {
    eventSource?.close();
    eventSource = null;
  });
}
```

호출 위치는 **`OrderRsvsPage` 마운트 시 1회**가 적합 (페이지 벗어나면 close — 다른 페이지에서는 cron push 받을 일 없음). app 루트 호출은 불필요.

### 3-5. Store ([src/stores/orderRsvCartStore.ts](../../src/stores/orderRsvCartStore.ts), [src/stores/orderRsvTmplStore.ts](../../src/stores/orderRsvTmplStore.ts) 신규)

[orderCartStore](../../src/stores/orderCartStore.ts) 패턴 미러링. **생성/수정 통합 페이지의 모드 분기 truth source.**

```ts
// orderRsvCartStore.ts — 일회성 예약 작성/수정 draft
export const useOrderRsvCartStore = defineStore('orderRsvCart', () => {
  const selStore = ref<Store | null>(null)
  const cart = ref<CartItem[]>([])
  const memo = ref('')
  const rsvAt = ref<string>('')                // ISO. 신규 시 '' → UI 가 today 13:00 등 default
  const editingSeq = ref<number | null>(null)

  const isEditing = computed(() => editingSeq.value != null)

  /** 수정 모드 진입 — OrderRsvsPage 카드 ⋮ → 수정에서 호출 */
  function loadFromRsv(rsv: OrderRsvExt, store: Store) {
    selStore.value = store
    cart.value = rsv.menus.map((m) => ({ menuSeq: m.menuSeq, nm: m.menuNm, price: m.price, cnt: m.cnt }))
    memo.value = rsv.cmt ?? ''
    rsvAt.value = rsv.rsvAt
    editingSeq.value = rsv.seq
  }

  // setStore / changeStore / addItem / increment / decrement / setCnt / reset — orderCartStore 와 동일 시그니처
  return { selStore, cart, memo, rsvAt, editingSeq, isEditing, loadFromRsv, ... }
})
```

```ts
// orderRsvTmplStore.ts — 템플릿 작성/수정 draft
export const useOrderRsvTmplStore = defineStore('orderRsvTmpl', () => {
  const selStore = ref<Store | null>(null)
  const cart = ref<CartItem[]>([])
  const nm = ref('')                           // 템플릿명
  const dayTypes = ref<DayType[]>([])
  const rsvTime = ref<string>('')              // 'HH:mm:ss'
  const startDt = ref<string | null>(null)
  const endDt = ref<string | null>(null)       // null = 무기한
  const cmt = ref('')
  const active = ref(true)
  const editingSeq = ref<number | null>(null)

  const isEditing = computed(() => editingSeq.value != null)

  function loadFromTmpl(tmpl: OrderRsvTmplExt, store: Store) { /* hydrate 모든 필드 */ }
  function reset() { /* 모든 필드 초기화 */ }

  return { ... }
})
```

**상태 전이** ([orderCartStore 와 동일](../flows/ORDER_EDIT_FLOW.md#5-ordercartstore-의-상태-전이)):

| 상태     | `editingSeq` | `selStore` | `cart`     | `isEditing` |
| -------- | ------------ | ---------- | ---------- | ----------- |
| Empty    | null         | null       | []         | false       |
| NewDraft | null         | Store      | [...items] | false       |
| Editing  | number       | Store      | [...items] | true        |

---

## 4. 재사용 / 신규 컴포넌트

### 4-1. 재사용 (수정 없이)

- [StoreGrid.vue](../../src/components/grid/StoreGrid.vue) — 좌측 매장 선택
- [MenuGrid.vue](../../src/components/grid/MenuGrid.vue) — 좌측 메뉴 선택
- [BTabs.vue](../../src/base-components/BTabs.vue) — `당일/모두`, 카테고리, `전체/활성/비활성`
- [BButton.vue](../../src/base-components/BButton.vue) — CTA, action 버튼
- [CartItemRow.vue](../../src/components/panel/order-cart/CartItemRow.vue) — 우측 패널 "담긴 메뉴"
- [CartSummary.vue](../../src/components/panel/order-cart/CartSummary.vue) — 합계

### 4-2. 신규 (예약 도메인)

| 위치                         | 컴포넌트                 | 역할                                                                            |
| ---------------------------- | ------------------------ | ------------------------------------------------------------------------------- |
| `components/order-rsvs/`     | `RsvReadyCard.vue`       | 진행 중 예약 카드 (헤더 + ⋮수정/삭제/템플릿칩/남은시간/메뉴/메모/[접수][취소])  |
| `components/order-rsvs/`     | `RsvHistoryCard.vue`     | 처리 이력 카드 (상태칩 ✓접수/✕취소 + [복구])                                    |
| `components/order-rsvs/`     | `RsvRemainingBadge.vue`  | `🕐 N분 후` 배지 (남은 시간 + 색상)                                             |
| `components/panel/rsv-info/` | `OrderRsvCartPanel.vue`  | OrderRsvsEditPage 우측 패널 (예약일시·비고·담긴메뉴·합계·CTA)                   |
| `components/panel/rsv-tmpl/` | `RsvTmplPanel.vue`       | OrderRsvTmplsEditPage 우측 패널 (템플릿명·반복요일·시작시간·기간·비고·메뉴·CTA) |
| `components/order-rsvs/`     | `DayTypeSelector.vue`    | 월~일 토글 그룹 (`SelectButton` multiple 또는 ToggleButton 7개)                 |
| `components/order-rsvs/`     | `RsvTmplStatsCards.vue`  | 템플릿 페이지 상단 통계 4카드                                                   |
| `components/order-rsvs/`     | `RsvTmplTable.vue`       | 템플릿 목록 테이블 (PrimeVue DataTable 사용)                                    |
| `composables/`               | `useRsvRemainingTime.ts` | rsvAt 기준 남은 시간 + 색상 status                                              |
| `stores/`                    | `orderRsvCartStore.ts`   | 일회성 예약 작성/수정 draft (생성/수정 통합 페이지의 모드 분기)                 |
| `stores/`                    | `orderRsvTmplStore.ts`   | 템플릿 작성/수정 draft (생성/수정 통합 페이지의 모드 분기)                      |

### 4-3. `useRsvRemainingTime` (신규 composable)

`useElapsedTime` 패턴 미러링 — 단 카운트다운 방향. 임계값은 피그마 디자인의 `여유 / 30분↓ / 20분↓` 그대로 하드코딩.

```ts
export type RemainingStatus = 'fresh' | 'warning' | 'danger'

export interface RemainingTime {
  minutes: number          // 음수 가능 (예약시각 지남)
  label: string            // "18분 후" / "5분 전"
  status: RemainingStatus
}

/**
 * 예약시각 대비 남은시간 1분 단위 계산.
 * 임계치: 30분↓ warning, 20분↓ danger. 그 외 fresh.
 * (지난 예약은 minutes < 0 이지만 status 는 danger 유지)
 */
export function useRsvRemainingTime(rsvAt: MaybeRefOrGetter<string>) { ... }

export const REMAINING_STATUS_CLASSES: Record<RemainingStatus, { border: string; ... }> = { ... }
```

---

## 5. 화면별 상세 (피그마 매핑)

### 5-1. `OrderRsvsPage.vue` — 예약 관리 (메인)

피그마 [node 2113:2]

```
헤더:  예약 관리 · 당일 예약 · 실시간 동기화          [당일|모두] 매장 [전체▾] [+ 예약 추가]
본문:  ● 진행 중 예약 (N)                              범례: ● 여유  ● 30분↓  ● 20분↓
       <카드 그리드 (auto-fill, minmax(388px, 1fr)) — RsvReadyCard>
       ● 처리 이력 (당일) (M)                                    ※ 처리 후 1시간 이내 복구 가능
       <카드 그리드 — RsvHistoryCard>
```

- 데이터: `useOrderRsvsMonitorQuery(selDayMode)` → `cReadyRsvs`, `cHistoryRsvs`
- 헤더 [+ 예약 추가] → `orderRsvCartStore.reset()` → `router.push('/order-rsvs/edit')`
- SSE: `useOrderRsvStream()` — `rsv:created` (cron 자동 생성) 만 수신
- 사이드바 배지: 30분 이내 예약 카운트를 layoutStore (또는 routes meta) 에 반영 — `routes.ts` 의 `badge: 3` 을 동적 값으로 교체. (별도 task — 5-1 본 페이지 완성 후)

#### 5-1-1. `RsvReadyCard`

- props: `rsv: OrderRsvExt`
- composable: `useRsvRemainingTime(() => rsv.rsvAt)` → border 색상 분기
- 헤더: `매장명` + `예약시각 (HH:mm)` + **⋮ more menu** (수정/삭제) — `OrderReadyCard` 패턴
- 출처 칩: `tmplNm` 있으면 `#{{ tmplNm }}` (템플릿 색), 없으면 `#일회성` (회색)
- 남은시간 배지: `🕐 {{ minutes }}분 후`
- 메뉴 리스트 (이름 ··········· ×수량) — `OrderReadyCard` 패턴
- 메모 (있을 때만): `📝 비고`
- 액션: `[✓ 주문 접수]` (primary, 2/3) · `[취소]` (outlined danger, 1/3)
- emit: `accept(seq)`, `cancel(seq)`, **`edit(seq)`**, **`remove(seq)`**

#### 5-1-2. `RsvHistoryCard`

- props: `rsv: OrderRsvExt`
- 회색 톤. 헤더에 매장명 + 처리시각 + 상태 칩 (`✓ 접수 (주문 생성)` / `✕ 취소됨`)
- 출처 칩 + 메뉴 1줄 요약
- 액션: `[↺ 복구]` — `processedAt` 기준 1시간 초과 시 비활성 + 라벨 `복구 불가 (1시간 초과)`
- emit: `restore(seq)`

#### 5-1-3. 페이지 핸들러

```ts
// 수정 진입 — orderCartStore 의 onEdit 패턴 미러링
function onEdit(seq: number) {
  const rsv = readyRsvs.value?.find((r) => r.seq === seq);
  if (!rsv) return;
  const store = stores.value?.find((s) => s.seq === rsv.storeSeq);
  if (!store) return;
  orderRsvCartStore.loadFromRsv(rsv, store);
  router.push("/order-rsvs/edit");
}

function onAdd() {
  // [+ 예약 추가] 버튼
  orderRsvCartStore.reset();
  router.push("/order-rsvs/edit");
}

// accept / cancel / restore / remove — mutation 호출 + onSuccess invalidate
```

### 5-2. `OrderRsvsEditPage.vue` — 예약 생성/수정 통합

피그마 [node 2121:2523, 2115:2]

`OrdersPage` 와 동일 골격. 좌측은 매장↔메뉴 v-show 토글, 우측만 `OrderRsvCartPanel` 로 교체. **store 의 `editingSeq` 로 모드 분기**.

```vue
<template>
  <div class="flex h-full gap-6 ...">
    <StoreGrid
      v-show="selStore == null"
      :stores
      :categories="storeCategories"
      :active="selStore == null"
      @select="onSelectStore"
      class="flex-1"
    />
    <MenuGrid
      v-show="selStore != null"
      :menus
      :categories="menuCategories"
      :active="selStore != null"
      @add="onAddMenu"
      class="flex-1"
    />
    <OrderRsvCartPanel
      v-model:rsv-at="rsvAt"
      v-model:memo="memo"
      :store="selStore"
      :items="cart"
      :is-editing="isEditing"
      @increment="orderRsvCartStore.increment"
      @decrement="orderRsvCartStore.decrement"
      @update-cnt="orderRsvCartStore.setCnt"
      @change-store="orderRsvCartStore.changeStore"
      @reset="orderRsvCartStore.reset"
      @save="onSave"
      @cancel="onCancel"
    />
  </div>
</template>

<script setup lang="ts">
const orderRsvCartStore = useOrderRsvCartStore();
const { selStore, cart, memo, rsvAt, isEditing, editingSeq } =
  storeToRefs(orderRsvCartStore);

const { mutate: createRsv } = useOrderRsvCreateMutation();
const { mutate: updateRsv } = useOrderRsvUpdateMutation();

function onSave() {
  const payload = {
    storeSeq: selStore.value!.seq,
    rsvAt: rsvAt.value,
    cmt: memo.value || undefined,
    menus: cart.value.map(({ menuSeq, price, cnt }) => ({
      menuSeq,
      price,
      cnt,
    })),
  };
  if (isEditing.value && editingSeq.value != null) {
    updateRsv(
      { seq: editingSeq.value, payload },
      {
        onSuccess: () => {
          reset();
          push("/order-rsvs");
          toast("수정 완료");
        },
      },
    );
  } else {
    createRsv(payload, {
      onSuccess: () => {
        reset();
        push("/order-rsvs");
        toast("예약 등록");
      },
    });
  }
}

function onCancel() {
  orderRsvCartStore.reset();
  router.push("/order-rsvs");
}
</script>
```

#### `OrderRsvCartPanel` 구성

상단 매장 헤더 → 구분선 → **예약 정보** (예약 일시: 날짜 + 시간 분리, 비고) → 구분선 → 담긴 메뉴 (CartItemRow 재사용) → CartSummary → [취소][💾 저장]

- 날짜·시간 입력은 PrimeVue `DatePicker` (date) + `DatePicker` (time). 둘을 합쳐 `rsvAt` ISO 로 변환.
- CTA 라벨은 `isEditing` 분기: `예약 등록` / `수정 완료`.

#### 수정 흐름 (요약)

```
OrderRsvsPage 카드 ⋮ → 수정
  ↓ orderRsvCartStore.loadFromRsv(rsv, store)
  ↓ router.push('/order-rsvs/edit')
OrderRsvsEditPage 마운트 (또는 KeepAlive 활성)
  ↓ storeToRefs 로 hydrate 상태 자동 표시 (CTA "수정 완료")
사용자 수정
  ↓ store actions (increment/setCnt 등)
[수정 완료] 클릭
  ↓ updateRsv mutation → onSuccess
  ↓ store.reset() + toast + router.push('/order-rsvs')
```

### 5-3. `OrderRsvTmplsPage.vue` — 템플릿 목록

피그마 [node 2121:3352]

```
헤더:  예약 템플릿                                 매장 [전체▾] 요일 [전체▾] [전체|활성|비활성] [+ 템플릿 추가]
통계:  [전체 12] [활성 10] [비활성 2] [오늘 자동 생성 6]
본문:  <RsvTmplTable>
       템플릿명 | 매장 | 요일 | 시작 | 메뉴 요약 | 금액 | 기간 | 활성 토글 | [편집][🗑]
```

- 데이터: `useOrderRsvTmplsQuery(filters)`, `useOrderRsvTmplStatsQuery()` (list 에서 derive)
- 행 [편집] → `orderRsvTmplStore.loadFromTmpl(tmpl, store)` → `router.push('/reservation-templates/edit')`
- 활성 토글 → `patchActive(seq, value)` mutation, 낙관적 업데이트 + onSuccess invalidate
- 행 [🗑] → 확인 다이얼로그 후 `remove(seq)` + onSuccess invalidate
- [+ 템플릿 추가] → `orderRsvTmplStore.reset()` → `router.push('/reservation-templates/edit')`
- 테이블은 PrimeVue `DataTable` (sort/page 내장). 요일 컬럼은 7개 칩 (선택된 요일만 강조)

### 5-4. `OrderRsvTmplsEditPage.vue` — 템플릿 생성/수정 통합

피그마 [node 2127:3676, 2127:3919]

`OrderRsvsEditPage` 와 동일 골격. 우측 패널만 `RsvTmplPanel` 로 교체. **store 의 `editingSeq` 로 모드 분기**.

#### `RsvTmplPanel` 구성

매장 헤더 → 템플릿 정보(템플릿명 + DayTypeSelector + 시작시간 DatePicker(time) + 기간(시작일 ~ 종료일/`무기한` 체크) + 비고 + active 토글) → 담긴 메뉴 → CartSummary → [취소][💾 저장]

#### 수정 흐름

```
OrderRsvTmplsPage 행 [편집] 클릭
  ↓ orderRsvTmplStore.loadFromTmpl(tmpl, store)
  ↓ router.push('/reservation-templates/edit')
OrderRsvTmplsEditPage 마운트
  ↓ storeToRefs hydrate (CTA "수정 완료")
[저장] → updateTmpl mutation → onSuccess
  ↓ store.reset() + toast + router.push('/reservation-templates')
```

테이블 행에서 `tmpl.menus` 가 이미 list aggregate 로 포함되어 있다면 `fetchById` 추가 호출 불필요. (백엔드 stub 단계에서 list 응답에 menus 포함하도록)

---

## 6. 구현 순서

각 단계는 PR 1개를 가정. 백엔드 미구현이라 mock 단계 (1~2) 부터 시작.

| 단계                                | 범위                                                                                                                                              | 종속성 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **1. 데이터 레이어**                | `types/reservation.ts`, `apis/orderRsv*Api.ts` (mock 반환), `queries/orderRsv*Query.ts` (mutation invalidate 포함), `queryKeys` 추가              | —      |
| **2. 메인 페이지 (조회)**           | `OrderRsvsPage` + `RsvReadyCard` + `RsvHistoryCard` + `RsvRemainingBadge` + `useRsvRemainingTime` (액션 mutation 미포함, 카드는 read-only 표시만) | 1      |
| **3. 메인 페이지 (액션)**           | accept / cancel / restore / remove mutation 연결 + ⋮ 메뉴 + 토스트                                                                                | 2      |
| **4. 예약 생성/수정 통합 페이지**   | `orderRsvCartStore` + `OrderRsvsEditPage` + `OrderRsvCartPanel` + 라우트 `/order-rsvs/edit` + 메인 페이지 ⋮→수정·[+ 예약 추가] 연결               | 1, 3   |
| **5. 템플릿 목록**                  | `OrderRsvTmplsPage` + `RsvTmplStatsCards` + `RsvTmplTable` + `DayTypeSelector`                                                                    | 1      |
| **6. 템플릿 생성/수정 통합 페이지** | `orderRsvTmplStore` + `OrderRsvTmplsEditPage` + `RsvTmplPanel` + 라우트 `/reservation-templates/edit` + 목록 [편집]·[+ 템플릿 추가] 연결          | 5      |
| **7. SSE 연동** (`rsv:created` 만)  | `useOrderRsvStream` — 백엔드 cron + endpoint 준비 후. 현재는 mock cron 으로 setInterval 흉내도 가능                                               | 1, 2   |
| **8. 사이드바 배지 동기화**         | 30분 이내 예약 카운트를 routes meta badge 로 반영                                                                                                 | 2      |

각 단계 시작 시 사용자에게 확인 후 착수.

---

## 7. Mock 데이터 전략

`apis/orderRsv*Api.ts` 함수는 환경 분기 없이 항상 mock 반환으로 시작 (백엔드 완성 시 일괄 교체). mock 데이터는 같은 파일 또는 `apis/__mock__/orderRsv.ts` 에 분리.

- 진행 중: 매장별 다른 시간대 5~6건 (남은 시간 fresh/warning/danger 섞이게)
- 처리 이력: 30분/45분/70분 전 처리된 3건 (1시간 초과 케이스 포함)
- 템플릿: 8~12건 (활성/비활성 섞임)
- `setTimeout(_, 200)` 으로 비동기 흉내

mutation 도 mock — 로컬 배열 조작 후 반환. **mutation 의 `onSuccess` 에서 `invalidateQueries` 가 정식 갱신 수단** (mock/실제 동일 경로). SSE 의존도 없음.

선택: §6 단계 7에서 SSE 도입 시 mock cron 도 작성 가능 — `setInterval(() => fakeCreate(), 60_000)` 로 1분마다 임의 인스턴스 추가 → 캐시 push.

---

## 8. 디자인 편차 메모 (claude-collaboration §3 기준)

| 항목                  | 피그마                  | 구현 결정                                                          |
| --------------------- | ----------------------- | ------------------------------------------------------------------ |
| 카드 색상 임계값      | 30분↓ 주황, 20분↓ 빨강  | **그대로 적용** (`useRsvRemainingTime` 하드코딩)                   |
| 진행 중 카드 그리드   | 4열 고정                | `auto-fill, minmax(388px,1fr)` (`OrdersMonitorPage` 패턴 — 반응형) |
| 처리 이력 카드 그리드 | 3열 고정                | `auto-fill, minmax(320px,1fr)`                                     |
| 통계 카드 색상        | 파랑/초록/회색/보라     | 색상은 PrimeVue surface/primary 토큰 활용해 근접값                 |
| 카테고리 칩 색상      | 매장 카테고리별 다른 색 | 일단 단일 색 — 카테고리 색상 매핑은 별도 task                      |
| DatePicker 스타일     | Figma 가상 컴포넌트     | PrimeVue `DatePicker` 기본 따름 (덜 커스텀)                        |

---

## 9. 미결정 / 추후 확정

1. **카테고리 색상 매핑** — 매장/메뉴 카테고리에 색상 토큰을 둘지 (`m_store_category.options.color`)
2. **사이드바 배지 동작** — 현재 정적 `badge: 3`. 30분 이내 진행 중 예약 카운트로 reactive 변경할지 → 단계 8
3. **예약 시각이 지난 카드** 처리 — `minutes < 0` 일 때 카드 동작 (자동 취소? 별도 강조?)
4. **CartItemRow 재사용 시 단가 표시** — 카트는 합계, 예약 패널은 단가도 보여주는 듯 (피그마 `8,000`) → 컴포넌트 단가 prop 추가 또는 별도 RsvMenuRow 작성
5. **DayType 표기** — DB enum 영문 vs UI 한글(월/화/...) 매핑 위치 (composable or const)
6. **편집 페이지 KeepAlive 적용 여부** — `OrderRsvsEditPage` / `OrderRsvTmplsEditPage` 를 [AppLayout.vue](../../src/layouts/AppLayout.vue) 의 `KEEP_ALIVE_PAGES` 에 추가할지. 현재 영업 그룹은 `OrdersPage`/`OrdersMonitorPage` 만 캐시. store 가 reactive 라 KeepAlive 없어도 hydrate 상태는 유지됨 — 성능 최적화 목적의 추가만 검토 (단계 4·6 완료 후 결정)
7. **편집 중 다른 곳으로 이탈 시 보존 정책** — orderCartStore 와 동일하게 자동 보존 (다음 진입 시 hydrate 유지) 인지, [+ 예약 추가] 클릭 시 reset 분기로 충분한지

---

## 10. 협업 규약 준수 체크리스트

- 코딩 가이드라인: import 그룹 / `c` prefix computed / `Rsv` 약어 / `B*` 컴포넌트 / `<이름>Page` postfix ✅
- prime-vue 가이드: 새 PrimeVue 래퍼 만들 때 `node_modules/primevue/<comp>/index.mjs` 먼저 확인 ✅
- 디자인 편차 허용: §8 표 기준 ✅
- 디버깅 협업: 스타일 이슈 시 사용자 DevTools 확인 후 targeted 수정 ✅
