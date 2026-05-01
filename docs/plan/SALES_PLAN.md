# 주문내역관리 페이지 구현 방안

> 기간 단위 주문/매출 조회 (그리드) + 다차원 통계 시각화 (통계). 피그마 [주문내역관리_그리드탭 / 통계탭_기본·메뉴·점포 분석] 디자인 기반.
> 관련 테이블: `t_order`, `t_order_menu`, `t_payment`, `m_store`, `m_menu`, `m_menu_ctg`.

---

## 1. 핵심 원칙

1. **단일 페이지 / 두 탭** — `SalesPage` 안에서 [그리드] / [통계] 탭으로 분기.
2. **그리드 = 기간 범위 + 다중 필터** — 매장/메뉴/날짜범위/결제수단 필터, KPI 4 카드, 페이징 테이블, 미수 row 강조, 다중 선택 후 일괄 삭제.
3. **통계 = 3 개 분석 뷰** — 기본 / 메뉴 분석 / 점포 분석 — 단일 select 드롭다운으로 전환. 동일 날짜 범위 공유.
4. **통계는 read-only** — KPI 액션 없음. 관리 (결제·취소) 는 정산 페이지 책임. 분리.
5. **차트 라이브러리** — ApexCharts (`vue3-apexcharts`) — 기본 시각 품질 OOTB. 통계 탭 dynamic import 로 메인 번들에서 분리.
6. **삭제 = 진짜 t_order 삭제** — 정산 탭의 '결제 취소' 와 다름. 회계 정정 (잘못 입력) 용. 결제 후 t_payment cascade 삭제.

---

## 2. 페이지 / 라우트 구성

| 그룹 | 파일            | 라우트   | 비고                          |
| ---- | --------------- | -------- | ----------------------------- |
| 관리 | `SalesPage.vue` | `/sales` | 그리드/통계 탭 ✅ 라우트 존재 |

**탭 보존**: query string (`?tab=stats&view=menu`) — 정산 페이지와 동일 패턴.

---

## 3. 데이터 레이어

### 3-1. 백엔드 미구현 endpoint (협의 필요)

| 메서드 | 경로                                                                    | 응답                | 용도                                                                |
| ------ | ----------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------- |
| GET    | `/sales/orders?from=&to=&storeSeq=&menuSeq=&payType=`                   | `OrderRowRes[]`     | 그리드 탭 거래 내역 — 클라 페이징 (최대 3개월 제한)                  |
| GET    | `/sales/orders/summary?from=&to=&storeSeq=&menuSeq=&payType=`           | `OrdersSummaryRes`  | 그리드 탭 KPI 4 카드 (조회 기간 매출/평균/현금/카드)                |
| GET    | `/sales/stats/basic?from=&to=`                                          | `StatsBasicRes`     | 통계 - 기본 뷰 (시간대/점포 TOP 5/결제유형/메뉴 TOP 5) — granularity 무관 |
| GET    | `/sales/stats/trend?from=&to=&granularity=day\|week\|month`             | `StatsTrendRes`     | **매출 추이 차트 전용** — 차트 로컬 segment 변경 시만 호출           |
| GET    | `/sales/stats/menu?from=&to=`                                           | `StatsMenuRes`      | 통계 - 메뉴 분석 뷰 (TOP 10 / 카테고리별 / 결제별 인기 / 피크타임)  |
| GET    | `/sales/stats/store?from=&to=&storeSeq=`                                | `StatsStoreRes`     | 통계 - 점포 분석 뷰 (점포별 매출/메뉴 비중/주문 빈도/미수/결제분포) |
| DELETE | `/sales/orders` body `{ orderSeqs }`                                    | 204                 | 그리드 탭 다중 삭제 (관리자 회계 정정)                              |

### 3-2. DTO 시그니처 (제안)

```java
// 그리드 row — 기존 settlement 의 TransactionRes 와 거의 동일.
// 'orderDate' 컬럼 (결제 날짜와 분리 표시) 추가, 'memo' (비고) 추가.
public record OrderRowRes(
    Long orderSeq,
    Short storeSeq,
    String storeNm,
    String menuSummary,           // "제육 1, 돈까스 1"
    Integer orderAmount,
    OffsetDateTime orderAt,
    PayType payType,              // CASH / CARD / null(미수)
    OffsetDateTime payAt,
    Integer payAmount,
    OrderStatus status,           // READY / COOKED / PAID
    String memo                   // 비고 (덜맵게/포장 등 — t_order.memo)
) {}

public record OrdersSummaryRes(
    Integer totalSales,           // 조회 기간 총 매출 + 건수
    Integer totalCount,
    Integer avgDailySales,        // 평균 일매출 + 평균 건수
    Integer avgDailyCount,
    PayMethodSummary cash,
    PayMethodSummary card
) {}

// 통계 - 기본 (granularity 무관 — 단순 집계)
public record StatsBasicRes(
    Integer totalSales, Integer prevSales,    // 헤더 우측 매출 + 증감 %
    Integer totalCount, Integer prevCount,    // 헤더 우측 건수 + 증감
    List<HourBucket> hourly,                  // 시간대별 (09~20)
    List<StoreSales> storesTop5,              // 점포별 매출 TOP 5
    List<PayMethodPart> payParts,             // 결제유형 비율 도넛 (cash/card/unpaid)
    List<MenuRank> menusTop5
) {}

// 매출 추이 — 차트 로컬 granularity 컨트롤로 분리 호출
public record StatsTrendRes(
    StatsGranularity granularity,
    List<TrendPoint> trend,                   // 현재 기간
    List<TrendPoint> trendPrev                // 비교 기간 (직전 동일 길이)
) {}

// 통계 - 메뉴 분석
public record StatsMenuRes(
    List<MenuRank> menusTop10,                // 수량 기준
    List<CategoryPart> categoryParts,         // 카테고리별 매출 도넛
    List<MenuRank> popularByCash,             // 현금 인기
    List<MenuRank> popularByCard,             // 카드 인기
    List<MenuRank> peakTimeMenus              // 피크타임 (12시) 인기
) {}

// 통계 - 점포 분석
public record StatsStoreRes(
    List<StoreSales> stores,                  // 점포별 매출 (전체)
    List<StoreMenuPart> storeMenuParts,       // 점포별 메뉴 비중 (storeSeq 별 필터)
    List<StoreCount> orderCounts,             // 주문 빈도
    List<StoreUnpaid> unpaidByStore,          // 미수 현황 (점포별)
    List<StorePayDistribution> payDistribution // 결제방식 분포 (점포별 stacked)
) {}
```

세부 sub-DTO (`HourBucket { hour: Int, amount: Int }`, `TrendPoint { label, amount }`, `MenuRank { menuNm, count, amount }`, `CategoryPart { ctgNm, percent, amount }`, `StoreSales { storeNm, amount }`, `StoreMenuPart { storeSeq, parts: [{menuNm, count, percent}] }`, `StoreCount { storeNm, count }`, `StoreUnpaid { storeNm, amount, count }`, `StorePayDistribution { storeNm, cash, card, unpaid }`) 는 §3-3 프론트 타입 참조.

### 3-3. 프론트 타입 ([src/types/salesStats.ts](../../src/types/salesStats.ts) 신규, [src/types/sales.ts](../../src/types/sales.ts) 확장)

```ts
// types/sales.ts 확장
export interface OrderRow extends Transaction {
  status: OrderStatus;
  memo: string | null;
}

export interface OrdersSummary {
  totalSales: number;
  totalCount: number;
  avgDailySales: number;
  avgDailyCount: number;
  cash: PayMethodSummary;
  card: PayMethodSummary;
}

// types/salesStats.ts (신규)
export interface HourBucket {
  hour: number;
  amount: number;
}
export interface TrendPoint {
  label: string;
  amount: number;
}
export interface MenuRank {
  menuNm: string;
  count: number;
  amount: number;
}
export interface CategoryPart {
  ctgNm: string;
  percent: number;
  amount: number;
}
export interface StoreSales {
  storeSeq: number;
  storeNm: string;
  amount: number;
}
export interface StoreCount {
  storeSeq: number;
  storeNm: string;
  count: number;
}
export interface StoreUnpaid {
  storeSeq: number;
  storeNm: string;
  amount: number;
  count: number;
}
export interface StorePayDistribution {
  storeSeq: number;
  storeNm: string;
  cash: number;
  card: number;
  unpaid: number;
}
export interface StoreMenuPart {
  storeSeq: number;
  parts: { menuNm: string; count: number; percent: number }[];
  etcCount: number; // "기타" 항목 (TOP 4 외 합산)
}
export interface PayMethodPart {
  payType: "CASH" | "CARD" | "UNPAID";
  amount: number;
  percent: number;
}

export interface StatsBasic {
  totalSales: number;
  prevSales: number;
  totalCount: number;
  prevCount: number;
  hourly: HourBucket[];
  storesTop5: StoreSales[];
  payParts: PayMethodPart[];
  menusTop5: MenuRank[];
}

export interface StatsTrend {
  granularity: StatsGranularity;
  trend: TrendPoint[];
  trendPrev: TrendPoint[];
}

export interface StatsMenu {
  menusTop10: MenuRank[];
  categoryParts: CategoryPart[];
  popularByCash: MenuRank[];
  popularByCard: MenuRank[];
  peakTimeMenus: MenuRank[];
}

export interface StatsStore {
  stores: StoreSales[];
  storeMenuParts: StoreMenuPart[];
  orderCounts: StoreCount[];
  unpaidByStore: StoreUnpaid[];
  payDistribution: StorePayDistribution[];
}

export type StatsGranularity = "day" | "week" | "month";
```

### 3-4. API ([src/apis/salesApi.ts](../../src/apis/salesApi.ts) 확장, salesStatsApi 는 동일 파일에 통합)

```ts
// salesApi.ts 추가
// 그리드 탭 — 클라 페이징 (페이지/사이즈/정렬 없음). 백엔드는 한번에 전체 row.
// 가드: from~to 가 90일 초과면 프론트에서 호출 차단.
export interface OrdersParams {
  from: string;
  to: string;
  storeSeq?: number;
  menuSeq?: number;
  payType?: PayType | "UNPAID";
}
export interface DateRangeParams {
  from: string;
  to: string;
}
export interface StatsTrendParams extends DateRangeParams {
  granularity: StatsGranularity; // trend 차트 전용
}
export interface StatsStoreParams extends DateRangeParams {
  storeSeq?: number; // 점포별 메뉴 비중 select
}

export function fetchOrders(params: OrdersParams): Promise<OrderRow[]>;
export function fetchOrdersSummary(
  params: OrdersParams,
): Promise<OrdersSummary>;
export function fetchStatsBasic(params: DateRangeParams): Promise<StatsBasic>;
export function fetchStatsTrend(params: StatsTrendParams): Promise<StatsTrend>;
export function fetchStatsMenu(params: DateRangeParams): Promise<StatsMenu>;
export function fetchStatsStore(params: StatsStoreParams): Promise<StatsStore>;
export function removeOrders(orderSeqs: number[]): Promise<void>;
```

### 3-5. Query

```ts
// queryKeys 추가
salesOrders: ['sales', 'orders'] as const,
salesOrdersSummary: ['sales', 'orders', 'summary'] as const,
salesStatsBasic: ['sales', 'stats', 'basic'] as const,
salesStatsTrend: ['sales', 'stats', 'trend'] as const,
salesStatsMenu: ['sales', 'stats', 'menu'] as const,
salesStatsStore: ['sales', 'stats', 'store'] as const,

// useOrdersQuery(params)
// useOrdersSummaryQuery(params)
// useStatsBasicQuery(params)
// useStatsTrendQuery(params) — 차트 로컬 granularity 변경 시만 refetch
// useStatsMenuQuery(params)
// useStatsStoreQuery(params)
// useOrdersRemoveMutation — onSuccess invalidate sales/orders/payments
```

기존 `paymentsQuery.invalidateAll` 패턴 재사용 — orders 삭제 mutation 도 sales/payments/orders 모두 invalidate.

---

## 4. 화면별 상세

### 4-1. 공통 — 페이지 헤더 + 탭

```
주문내역관리
[그리드][통계]
```

- 제목 `주문내역관리` 고정
- **탭** — `BTabs variant="outline"` (정산 페이지와 동일 컴포넌트, 동일 variant)
- 인쇄 기능은 제외 (§7-8).

### 4-2. 그리드 탭

#### 필터 바

```
[🏪 매장 검색] [🍽 메뉴 검색] [📅 2026.04.01 ~ 04.15] [전체 ▾]                [검색][초기화]
```

- **매장 검색** — `Select` (단일) — `useStoresQuery` 옵션, 검색 가능
- **메뉴 검색** — `Select` (단일) — `useMenusQuery` 옵션
- **날짜 범위** — `DatePicker selectionMode="range"` — yyyy-MM-dd 양 끝. **최대 90일 (3개월) 제한** (§7-5). 초과 시 검색 버튼 disabled + inline warning.
- **결제수단** — `Select` 옵션 [전체/현금/카드/미수]
- **검색** — 명시적 trigger 만 refetch (§7-4). 필터 변경 자체로는 호출 X.
- **초기화** — 모든 필터 reset 후 검색 버튼 활성. (자동 refetch 안 함)

> URL query 에 필터 보존 (`?from=...&to=...&storeSeq=...`) — 새로고침/공유 자연.

#### KPI 4 카드

```
┌ 조회 기간 매출 ┐ ┌ 평균 일매출 ┐ ┌ 현금 ┐ ┌ 카드 ┐
│ 256,000원      │ │ 128,000원   │ │ 128K │ │ 96K  │
│ 32건           │ │ 평균 16건   │ │ 16건 │ │ 12건 │
└─ (강조 fill) ──┘ └─────────────┘ └──────┘ └──────┘
```

- 첫 카드 (조회 기간 매출) primary fill 강조 — 'most important' 신호
- `useOrdersSummaryQuery(params)` 결과 매핑

#### 데이터 테이블

```
☐  # | 매장 | 메뉴 | 주문금액↓ | 주문일시 | 결제방식(chip) | 결제날짜 | 결제금액 | 상태(chip) | 비고
```

- 미수 row → `bg-red-50!` (정산 탭과 동일 패턴)
- 결제방식 chip — `PayTypeChip` 재사용
- 상태 chip — `● 미결제` (red) / `✓ 완료` (green)
- 정렬 — `주문금액` 등 컬럼 클릭. **클라 정렬** (PrimeVue DataTable 기본).
- footer — `총 32건 [10건▾] · pagination` PrimeVue DataTable **클라 페이징** (§7-5)
- header checkbox + row checkbox (`v-model:selection`)

#### 하단 sticky 액션 바 (선택 시만 등장)

```
2건 선택 24,000원                                               [삭제]
```

- 선택 1+ 시 등장. `[삭제]` 클릭 → confirm → `useOrdersRemoveMutation` 호출.
- 정산의 '결제 취소' 와 다름: 진짜 `t_order` row 삭제 (cascade `t_order_menu`, `t_payment`).

### 4-3. 통계 탭

#### 헤더

```
[기본 뷰▾] [📅 날짜 범위]                        (기본 뷰만 우측 [매출 ▲ / 건수 ▼])
```

- **뷰 select** — `Select` 옵션 [기본 뷰 / 메뉴 분석 / 점포 분석] — `?view=` query 보존
- **날짜 범위** — 그리드 탭과 **별도 state** (§7-2). 통계는 기간 제한 없음 (§7-6).
- **granularity 컨트롤은 헤더에 없음** — 매출 추이 차트 1개에만 영향이라 차트 카드 로컬로 이동 (§7-9, §4-3-1)
- **우측 KPI 칩** — 기본 뷰만 표시 (총 매출 + 전기 대비 %, 총 건수 + 전기 대비)
- **⚙ (표시 항목 토글)** — MVP 제외 (§7-3, deferred)

#### 4-3-1. 기본 뷰 (2 행 그리드)

```
┌ 시간대별 매출 (bar) ─────┐ ┌ 매출 추이      [일|주|월] ─┐
│ 09 10 11 [12🟢] 13 ... 20│ │ 월화수목금토일 — 이번주     │
└──────────────────────────┘ └─────────────────────────────┘
┌ 점포별 매출 ─────┐ ┌ 결제유형 비율 (donut) ─┐ ┌ 메뉴 판매 TOP 5 ─┐
│ 세림  ████ 64K  │ │   256K                  │ │ 1 갈비탕 곰 12건 │
│ 원마789 ███ 52K │ │   현금 50% / 카드 ... │ │ 2 제육      10건 │
└─────────────────┘ └────────────────────────┘ └──────────────────┘
```

- 1 행: 2 컬럼 (시간대별 / 추이) — 큰 차트 2개
- 2 행: 3 컬럼 (점포 TOP 5 / 결제유형 / 메뉴 TOP 5)
- 시간대별 — 피크 시간대 색 강조 (라벨 우측 상단 `피크 12시`)
- **매출 추이** — 카드 우측 상단에 `[일|주|월]` segment (`BTabs variant="segmented" size="sm"`). 변경 시 `useStatsTrendQuery` 만 refetch. 비교 series (이번주 vs 지난주) 동일 차트에 두 줄.

#### 4-3-2. 메뉴 분석 뷰 (2 행 그리드)

```
┌ 메뉴 판매 TOP 10 (bar)  ──┐ ┌ 카테고리별 매출 (donut) ─┐
│ 갈비탕 제육 김치찌 ...    │ │ 탕/찌개 35% ...           │
└──────────────────────────┘ └───────────────────────────┘
┌ 현금 인기메뉴 ─┐ ┌ 카드 인기메뉴 ─┐ ┌ 피크타임 메뉴 (12시)─┐
│ 갈비탕 곰 8건│ │ 제육      5건  │ │ 갈비탕 곰   6건       │
└──────────────┘ └────────────────┘ └──────────────────────┘
```

#### 4-3-3. 점포 분석 뷰 (2 행 그리드)

```
┌ 점포별 매출 (bar) ───────┐ ┌ 점포별 메뉴 비중 [세림▾]──┐
│ 세림 원마789 A동 ... 매출순│ │ donut + list, 기타 드릴다운│
└──────────────────────────┘ └───────────────────────────┘
┌ 주문 빈도 ──┐ ┌ 미수 현황 ──┐ ┌ 결제방식 분포 (stacked) ─┐
│ 세림 12건  │ │ 세림 16K 2건│ │ 세림   ███ green ██ blue ▌red│
└────────────┘ └─────────────┘ └──────────────────────────┘
```

- 점포별 메뉴 비중 — `Select` 로 점포 전환, donut + 우측 list (TOP 4 + 기타 합산)
- 미수 현황 — `bg-red-50` 강조, 점포별 합계 정렬
- 결제방식 분포 — horizontal stacked bar (현금/카드/미수)

---

## 5. 컴포넌트 구성

### 5-1. 신규

| 위치                       | 컴포넌트                     | 역할                                                        |
| -------------------------- | ---------------------------- | ----------------------------------------------------------- |
| `pages/`                   | `SalesPage.vue`              | 헤더 + 탭 + 그리드/통계 분기                                |
| `components/sales/`        | `SalesGridFilterBar.vue`     | 매장/메뉴/날짜/결제수단 + 검색/초기화                       |
| `components/sales/`        | `SalesSummaryCards.vue`      | 그리드 KPI 4 카드 (정산의 SalesSummaryCards 와 다름 — 분리) |
| `components/sales/`        | `SalesGridTable.vue`         | 그리드 데이터 테이블 + 다중 선택 + sticky 삭제 바           |
| `components/sales/`        | `SalesStatsHeader.vue`       | 통계 탭 헤더 (뷰/날짜/granularity/우측 KPI 칩)              |
| `components/sales/`        | `StatsBasicView.vue`         | 기본 뷰 (5 카드)                                            |
| `components/sales/`        | `StatsMenuView.vue`          | 메뉴 분석 뷰 (5 카드)                                       |
| `components/sales/`        | `StatsStoreView.vue`         | 점포 분석 뷰 (5 카드)                                       |
| `components/sales/charts/` | `BarHourlyChart.vue`         | 시간대별 매출 — 피크 강조                                   |
| `components/sales/charts/` | `BarTrendChart.vue`          | 매출 추이 (비교 series)                                     |
| `components/sales/charts/` | `BarHorizontalRanking.vue`   | 점포별/메뉴별 가로 막대 ranking                             |
| `components/sales/charts/` | `DonutPartChart.vue`         | 결제유형 / 카테고리 도넛 + legend                           |
| `components/sales/charts/` | `BarStackedDistribution.vue` | 결제방식 분포 stacked bar                                   |
| `components/sales/charts/` | `RankList.vue`               | 메뉴 TOP N / 인기 메뉴 — 단순 list                          |
| `composables/`             | `useDateRange.ts`            | 범위 nav (from/to + 일/주/월 단위 스냅)                     |

### 5-2. 재사용

- `BTabs`, `BButton`, `BInfoBanner`
- `PayTypeChip` (정산 탭에서 만든 것)
- `useStoresQuery`, `useMenusQuery`, `useMenuCtgsQuery`
- `useSearchFilter` (필터 select 내부 자모 검색)

---

## 6. 차트 라이브러리

### 6-1. 선택: ApexCharts (`vue3-apexcharts`)

- 이유: 기본 색상/애니메이션/툴팁/zoom 등 OOTB 시각 품질 우수 — POS 대시보드처럼 한 페이지에 차트 5~6개 모일 때 디자인 비용 절감 효과 큼.
- 단점: 번들 ~150KB (Chart.js ~70KB 대비 ↑). 통계 탭은 동적 import 로 분리 (§9 트레이드오프).
- API: `<Apexchart type="bar|donut|line" :options :series height="240" />`

### 6-2. 설치

```sh
pnpm add apexcharts vue3-apexcharts
```

`main.ts` 에 plugin 등록 (글로벌 component):
```ts
import VueApexCharts from 'vue3-apexcharts'
app.use(VueApexCharts)
// 그러면 <Apexchart> 글로벌 사용 가능
```

### 6-3. 공통 옵션 helper

`utils/chartOptions.ts` — 우리 theme color (primary-500, surface-200/300, red-500 등) 매핑 base options + 한국어 locale (천 단위 `,` / `원` suffix). 차트 wrapper 들이 공통 import.

차트별 props 타입은 `apexcharts` 의 `ApexOptions` 타입 import 해서 `defineProps` 에 명시.

---

## 7. 결정 사항

| #    | 항목                    | 결정                                                                                                                                                                          |
| ---- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7-1  | 탭 보존                 | URL query (`?tab=stats&view=menu`)                                                                                                                                            |
| 7-2  | 그리드/통계 날짜 state  | **분리** — 그리드는 정밀 조회용 (정확한 날짜 + 필터), 통계는 추세 분석 (긴 범위). 탭 전환해도 각 탭의 마지막 선택 유지.                                                       |
| 7-3  | 우측 ⚙ (표시 항목 토글) | MVP 제외. 모든 카드 항상 표시. 사용자 hide preference 는 차후.                                                                                                                |
| 7-4  | 그리드 자동 refetch     | **명시적 [검색] 버튼만**. 필터 변경은 trigger 안 함. 초기화도 자동 refetch 안 함.                                                                                             |
| 7-5  | 그리드 페이징           | **클라 페이징** — 백엔드는 한 번에 전체 row 응답. **날짜 범위 90일 (3개월) 제한** — 초과 시 검색 disabled + 안내. 정렬도 클라 (PrimeVue DataTable).                          |
| 7-6  | 통계 기간 제한          | **무제한** — 통계는 aggregate 응답이라 row 수 무관, 기간 길어도 부담 작음.                                                                                                    |
| 7-7  | 삭제 실행               | confirm 필수. cascade 영향 (`t_order_menu`, `t_payment` 같이 삭제) + 회계 정정 용도임을 메시지로 안내.                                                                        |
| 7-8  | 인쇄                    | **제외**. 헤더 인쇄 버튼 / `@media print` CSS 모두 미구현. PDF export 는 deferred.                                                                                           |
| 7-9  | granularity 위치        | **매출 추이 차트 카드 로컬** — 이 차트 1개에만 영향이라 글로벌 헤더에서 제거. `[일\|주\|월]` segment 가 차트 카드 우측 상단에 위치. 백엔드는 별도 `/sales/stats/trend` endpoint. |
| 7-10 | 차트 라이브러리         | **ApexCharts** (`vue3-apexcharts`). 기본 시각 품질 OOTB.                                                                                                                       |

## 8. 디자인 편차 / 메모

| 항목                  | 피그마                             | 결정                                                            |
| --------------------- | ---------------------------------- | --------------------------------------------------------------- |
| KPI 첫 카드 강조      | primary fill (텍스트 흰색)         | `bg-primary-500 text-surface-0` — 다른 카드 흰 배경과 위계 구분 |
| 통계 우측 KPI 칩      | 매출 ▲+8.2% / 건수 ▼-2건           | 증감 색: ▲=emerald, ▼=red. 절대값 fontWeight 강조               |
| 차트 색               | primary 톤 + amber/blue/red 보조   | theme.css 토큰 그대로 사용 — emerald-500, blue-500, red-500     |
| 점포별 메뉴 비중 기타 | "기타: 콜라 1, 된장찌개 1, 라면 1" | tooltip 또는 카드 하단 작은 글씨 — `text-xs text-surface-500`   |
| 정렬 표시 (▼)         | 헤더 클릭 시 ▼ 표시                | PrimeVue `sortable` 기본 UI                                     |

---

## 9. 트레이드오프

### 그리드 ↔ 통계 — 한 페이지 vs 별도 라우트

- 한 페이지 (현재 결정): 필터/날짜 공유 가능, 코드 응집. 단 큰 페이지 — code split (`<Suspense>` 가능).
- 별도 라우트: bundle 분리 자연. 단 필터 동기화 부담.
  → 한 페이지 + URL query view 분기. 통계 컴포넌트는 dynamic import (`defineAsyncComponent`) 로 bundle 분리.

### 통계 — 단일 select vs 탭

- 피그마는 select. 3 뷰 라 탭으로 가도 무리 없으나 select 가 미래 확장 (5+ 뷰) 에 유리.
  → select 유지.

### 차트 라이브러리 — Chart.js vs ECharts vs ApexCharts

- Chart.js: 가벼움 (~70KB). 인터랙션/디자인 default 평범 — 우리가 커스텀 비용 부담.
- ECharts: 강력 (지도/timeline 등). 290KB+. 본 페이지 요구엔 과스펙.
- ApexCharts: 기본 시각 품질 우수 — 색/툴팁/애니메이션 OOTB. ~150KB.
  → **ApexCharts** 채택. 통계 탭은 동적 import (`defineAsyncComponent`) 로 메인 번들에서 분리.

### 삭제 vs 결제 취소 분리 정책

- 삭제 = 회계 정정 (잘못 등록한 주문 자체 제거)
- 결제 취소 = 결제만 무효화 (주문은 유지, status COOKED 복귀)
  → 페이지/UI 분리. 삭제는 주문내역관리, 취소는 정산 페이지. 혼선 방지.

---

## 10. 구현 순서

| 단계                        | 범위                                                                                | 종속성        |
| --------------------------- | ----------------------------------------------------------------------------------- | ------------- |
| **1. 백엔드 endpoint 협의** | sales/orders, sales/orders/summary, stats/{basic,trend,menu,store}, DELETE 일괄     | —             |
| **2. 데이터 레이어**        | types, salesApi 확장, queries 추가                                                  | 1             |
| **3. 그리드 탭**            | FilterBar (90일 가드) + SummaryCards + GridTable (클라 페이징/정렬) + 삭제 mutation | 2             |
| **4. 차트 라이브러리 셋업** | apexcharts + vue3-apexcharts 설치, plugin 등록, chartOptions helper, PoC 1개        | — (병렬 가능) |
| **5. 통계 탭 - 기본 뷰**    | StatsHeader + StatsBasicView (5 카드) + BarTrendChart (로컬 granularity)            | 2, 4          |
| **6. 통계 탭 - 메뉴 분석**  | StatsMenuView + 차트                                                                | 5             |
| **7. 통계 탭 - 점포 분석**  | StatsStoreView + 점포 select + 차트                                                 | 5             |

각 단계 type-check 통과 보장. 백엔드 미구현 동안에는 mock 응답으로 시작 가능 (예약 페이지 패턴).

---

## 11. 협업 규약 준수

- 코딩 가이드라인: import 그룹 / `c` prefix computed / `B*` 컴포넌트 ✅
- 디자인 편차 허용 (§8 표) ✅
- prime-vue 가이드: Chart / DataTable lazy / Select 사용 첫 사례면 [docs/instruct/prime-vue.md](../instruct/prime-vue.md) 참고 ✅
- 협업 §1: 스타일 디버깅 시 사용자 DevTools 확인 후 targeted 수정 ✅
