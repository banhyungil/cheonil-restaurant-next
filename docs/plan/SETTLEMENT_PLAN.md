# 정산 페이지 구현 방안

> 일자별 매출/지출 집계 + 결제 내역 + 미수 일괄 수금. 피그마 [정산_정산탭 / 정산_수금탭] 디자인 기반.
> 관련 테이블: `t_order`, `t_order_menu`, `t_payment`, `t_expense`.

---

## 1. 핵심 원칙

1. **단일 페이지 / 두 탭** — `SettlementPage` 안에서 [정산][수금] 탭으로 분기.
2. **정산 = 단일 날짜만** — KPI 5 카드 + 거래 내역 (read-only). 통계/트렌드는 **주문내역 페이지** 책임.
3. **수금 = 모든 미수 (날짜 무관)** — 누적 미수 list + 체크박스 다중 선택 + [현금]/[카드]/[결제 취소] / 단일 선택 시 [분할 결제].
4. **미수 정의 (탭별 다름)**
   - 정산 탭 미수 KPI = 그날 미수 (그날 주문 중 결제 안 된 것)
   - 수금 탭 미수 list = 모든 미수 (날짜 무관, `t_order.status` ∈ {READY, COOKED})
5. **결제 처리** = `POST /payments` 또는 `/payments/batch` 또는 `/payments/split` → `t_payment` INSERT + `t_order.status='PAID'`.
6. **결제 취소** = `t_payment` 삭제 + `t_order.status` PAID → COOKED.

---

## 2. 페이지 / 라우트 구성

| 그룹 | 파일                 | 라우트        | 비고                             |
| ---- | -------------------- | ------------- | -------------------------------- |
| 정산 | `SettlementPage.vue` | `/settlement` | 정산/수금 탭 통합 ✅ 라우트 존재 |

**탭은 라우트가 아닌 페이지 내부 ref** — query string 으로 보존 (`/settlement?tab=collect`) 또는 단순 ref. 추천: query string (URL 공유/복귀 자연스러움).

---

## 3. 데이터 레이어

### 3-1. 백엔드 미구현 endpoint (협의 필요)

결제 엔드포인트는 **`/orders/payments/...`** namespace 로 통일 — payment 는 항상 주문 종속 (free-floating 없음).
취소는 `paymentSeq` 가 아닌 `orderSeqs` 기준 (분할 결제도 동일하게 처리).

| 메서드 | 경로                                                                             | 응답                 | 용도                                                 |
| ------ | -------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------- |
| GET    | `/sales/summary?date=YYYY-MM-DD`                              | `SalesSummaryRes`    | KPI 5개 (정산 탭) — 단일 날짜                  |
| GET    | `/sales/transactions?date=...&storeSeq=...&payType=...&page=` | Page<TransactionRes> | 정산 탭 거래 내역 — 단일 날짜                  |
| GET    | `/sales/unpaid?storeSeq=...&page=...`                         | Page<TransactionRes> | **수금 탭 미수** (날짜 무관)                   |
| POST   | `/orders/payments`                                            | `PaymentRes`         | 단건 결제                                      |
| POST   | `/orders/payments/batch`                                      | `PaymentRes[]`       | 다중 일괄 결제 ([현금]/[카드])                 |
| POST   | `/orders/payments/split`                                      | `PaymentRes[]`       | 단일 주문 분할 결제 (다이얼로그)               |
| POST   | `/orders/payments/batch-delete` body `{ orderSeqs }`          | 204                  | 결제 일괄 취소 (단건도 길이 1 로 통합)         |

### 3-2. DTO 시그니처 (제안)

```java
// 정산 KPI
public record SalesSummaryRes(
    LocalDate date,
    Integer totalSales,           // 당일 매출 (PAID + 미수 모두)
    Integer netSales,             // 순매출 (지출 차감)
    Integer prevSales,            // 전일 매출 (% 비교용)
    Integer expenseTotal,         // 당일 지출
    PayMethodSummary cash,        // { amount, count }
    PayMethodSummary card,
    PayMethodSummary unpaid       // { amount, count } — 미수
) {}

// 거래 내역 row
public record TransactionRes(
    Long orderSeq,
    Short storeSeq,
    String storeNm,
    String menuSummary,           // "제육 1, 돈까스 1"
    Integer orderAmount,
    OffsetDateTime orderAt,
    OffsetDateTime cookedAt,
    PayType payType,              // CASH / CARD / null(미수)
    OffsetDateTime payAt,
    Integer payAmount             // 결제금액 (미수면 0)
) {}
```

### 3-3. 프론트 타입 ([src/types/sales.ts](../../src/types/sales.ts), [src/types/payment.ts](../../src/types/payment.ts) 신규)

```ts
// types/sales.ts
export interface PayMethodSummary {
  amount: number;
  count: number;
}

export interface SalesSummary {
  date: string; // 'YYYY-MM-DD'
  totalSales: number;
  netSales: number;
  prevSales: number;
  expenseTotal: number;
  cash: PayMethodSummary;
  card: PayMethodSummary;
  unpaid: PayMethodSummary;
}

export interface Transaction {
  orderSeq: number;
  storeSeq: number;
  storeNm: string;
  menuSummary: string;
  orderAmount: number;
  orderAt: string;
  cookedAt: string | null;
  payType: PayType | null; // null = 미수
  payAt: string | null;
  payAmount: number;
}

// types/payment.ts (또는 order.ts 에 통합)
export type PayType = "CASH" | "CARD";

export interface Payment {
  seq: number;
  orderSeq: number;
  amount: number;
  payType: PayType;
  payAt: string;
}
```

### 3-4. API ([src/apis/salesApi.ts](../../src/apis/salesApi.ts), [src/apis/paymentsApi.ts](../../src/apis/paymentsApi.ts) 신규)

```ts
// salesApi.ts
export interface SalesSummaryParams {
  date: string; // 'YYYY-MM-DD'
}
export interface TransactionsParams {
  date: string; // 'YYYY-MM-DD' — 정산 탭은 단일 날짜
  storeSeq?: number;
  payType?: PayType | "UNPAID";
  page?: number;
  size?: number;
}
export interface UnpaidParams {
  // 수금 탭 — 날짜 없음 (모든 미수 누적 조회)
  storeSeq?: number;
  page?: number;
  size?: number;
}
export interface PageRes<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
}

export function fetchSummary(params: SalesSummaryParams): Promise<SalesSummary>;
export function fetchTransactions(
  params: TransactionsParams,
): Promise<PageRes<Transaction>>;
export function fetchUnpaid(
  params?: UnpaidParams,
): Promise<PageRes<Transaction>>;

// paymentsApi.ts
export interface PaymentCreatePayload {
  orderSeq: number;
  payType: PayType;
}
export interface PaymentSplit {
  payType: PayType;
  amount: number;
}
export interface PaymentSplitPayload {
  orderSeq: number;
  splits: PaymentSplit[];
}
export interface PaymentBatchDeletePayload {
  orderSeqs: number[];
}
export function create(payload: PaymentCreatePayload): Promise<Payment>;
export function createBatch(
  payloads: PaymentCreatePayload[],
): Promise<Payment[]>;
export function createSplit(payload: PaymentSplitPayload): Promise<Payment[]>;
export function batchDelete(payload: PaymentBatchDeletePayload): Promise<void>;
```

### 3-5. Query

```ts
// queryKeys
sales: ['sales'] as const,
salesSummary: ['sales', 'summary'] as const,
salesTransactions: ['sales', 'transactions'] as const,
salesUnpaid: ['sales', 'unpaid'] as const,
payments: ['payments'] as const,

// useSalesSummaryQuery(date)
// useTransactionsQuery(params)
// useUnpaidQuery(params?) — 수금 탭 전용 (날짜 무관)
// usePaymentCreateMutation / usePaymentBatchCreateMutation / usePaymentSplitMutation
// usePaymentBatchDeleteMutation — 단건/다건 통합 (orderSeqs 길이로 분기)
```

mutation 의 `onSuccess` 에서 `invalidateQueries` — sales / orders / payments 모두.

---

## 4. 화면별 상세

### 4-1. 공통 — 페이지 헤더

```
┌──────────────────────────────────────────────────────────┐
│ 정산                                                     │
│ [정산][수금]              < 2026.04.15(수) > [오늘]      │
└──────────────────────────────────────────────────────────┘
```

- 제목 `정산` 고정
- **탭** — `BTabs variant="outline"` 또는 underline 형식 (피그마는 underline)
- **날짜 네비** — `<` `>` 화살표 + 날짜 표시 + [오늘] 버튼 (단일 날짜만, 범위 모드 없음)
- **수금 탭에서는 날짜 네비 숨김** — 모든 미수 (날짜 무관)
- 통계/트렌드/기간 매출은 **주문내역 페이지** 책임 — 정산은 단일 날짜 정산만 집중.

### 4-2. 정산 탭

#### KPI 카드 (5개)

```
[당일 매출 16,000원 · 전일 대비 +2.1%]
[순매출 12,500원 · 지출 3,500원 차감]
[💵 현금 0원 · 0건]
[💳 카드 0원 · 0건]
[⚠ 미수 16,000원 · 1건 결제 필요]
```

- `useSalesSummaryQuery(date)` 결과 → 5개 카드
- 미수 카드는 색상 강조 (red)

#### 거래 내역 테이블

```
[전체 N] [현금 N] [카드 N] [미수 N]      [🔍 매장 검색]
─────────────────────────────────────
# / 매장 / 메뉴 / 주문금액 / 주문시간 / 완료시간 / 결제방식 / 결제날짜 / 결제금액
─────────────────────────────────────
... 미수 row 는 빨간 배경
─────────────────────────────────────
수금 완료 N건 · 미수 N건                       합계 64,000원
─────────────────────────────────────
총 42건 [10건▾]    < 1 2 3 4 5 >
```

- 필터 chip — `BTabs` (또는 자체 chip). 클릭 시 query 의 `payType` 변경 → refetch
- 매장 검색 — client-side filter (date 범위 한정 적은 row 가정) 또는 query 파라미터
- pagination — PrimeVue `DataTable` 의 lazy pagination (서버 페이지)
- footer — 합계 (`_.sumBy`)

### 4-3. 수금 탭

```
2026.04.15 거래 N건 · 합계 N,NNN원         [모든 미수 보기 ◯]   [🔍 매장 검색]
─────────────────────────────────────
☐ 매장 / 메뉴 / 주문금액 / 주문일자 / [미수기간*] / 결제방식
─────────────────────────────────────
✓ ... [💵 현금]
✓ ... [⚠ 미수]   ← bg-red-50
✓ ... [💳 카드]
─────────────────────────────────────
3건 선택 40,000원 (미수 1 · 완료 2)   [현금][카드][분할 결제] | [결제 취소]
─────────────────────────────────────
```

- **두 가지 모드** — 토글 `[모든 미수 보기]` 로 전환:
  - **OFF (기본)**: 선택 날짜의 모든 거래 (paid + unpaid). 데이터 = `useTransactionsQuery({ date })`
  - **ON**: 모든 미수 (날짜 무관). 데이터 = `useUnpaidQuery()`. `미수기간` 컬럼 노출.
- **체크박스 다중 선택**: header checkbox + row checkbox (PrimeVue `DataTable :selection`)
- **하단 액션 바** (sticky):
  - 좌측: `N건 선택 N,NNN원 (미수 N · 완료 N)` 카운트
  - 우측: `[현금]` / `[카드]` / `[분할 결제]` `|` `[결제 취소]`
- **액션 동작 (혼합 선택 안전)**:
  - `[현금]` / `[카드]` — 선택 중 **미수만** 일괄 결제 (`POST /payments/batch`, 단건이면 `POST /payments`). PAID 는 자동 무시.
  - `[분할 결제]` — **단일 미수 row** 선택 시만 활성. 다이얼로그에서 행 추가 (현금/카드 + 금액) → splits 합계 = 주문금액 일치 시 `POST /payments/split`
  - `[결제 취소]` — 선택 중 **PAID 만** 일괄 취소 (`DELETE /payments/batch` 또는 orderSeq 기반). 미수는 자동 무시.
- **결제 취소 사유**: 결제 후 환불/취소가 후일 발생할 수 있어 — 정산 탭이 아닌 수금 탭에서도 날짜 이동 + 일괄 취소 가능하게 함.

---

## 5. 컴포넌트 구성

### 5-1. 신규

| 위치                     | 컴포넌트                | 역할                                             |
| ------------------------ | ----------------------- | ------------------------------------------------ |
| `pages/`                 | `SettlementPage.vue`    | 헤더 + 날짜 네비 + 탭 분기                       |
| `components/settlement/` | `SettlementHeader.vue`  | 단일 날짜 네비 (탭=정산일 때만)                  |
| `components/settlement/` | `SalesSummaryCards.vue` | KPI 5 카드                                       |
| `components/settlement/` | `TransactionTable.vue`  | 정산 탭 거래 내역 (PAID 취소 가능)               |
| `components/settlement/` | `CollectionTable.vue`   | 수금 탭 — 미수 list (체크박스 + 결제 액션)       |
| `components/settlement/` | `SplitPaymentDialog.vue`| 단일 주문 분할 결제 (행 추가 + 합계 검증)        |
| `composables/`           | `useDateNav.ts`         | 단일 날짜 네비 로직 (prev/next/today)            |

### 5-2. 재사용

- `BTabs`, `BButton`, `BInfoBanner`
- PrimeVue `DataTable` (lazy + selection)
- `useSearchFilter` (매장명 자모/초성 검색)
- `useStoresQuery` (매장 정보 join)

---

## 6. 구현 순서

| 단계                               | 범위                                                                          | 종속성        |
| ---------------------------------- | ----------------------------------------------------------------------------- | ------------- |
| **1. 백엔드 endpoint 협의 + 구현** | sales/summary, sales/transactions, sales/unpaid, payments(+batch+split+취소) | —             |
| **2. 데이터 레이어** ✅            | types/sales.ts, types/payment.ts, salesApi/paymentsApi, queries               | 1             |
| **3. 공통 헤더**                   | SettlementHeader + useDateNav (단일 날짜)                                     | — (병렬 가능) |
| **4. 정산 탭**                     | SalesSummaryCards + TransactionTable + 결제 취소 동작                         | 2, 3          |
| **5. 수금 탭**                     | CollectionTable + 액션 바 + 일괄 mutation 연결                                | 2, 3          |
| **6. 분할 결제**                   | SplitPaymentDialog (단일 row 선택 시 활성)                                    | 5             |

각 단계 type-check 통과 보장. 백엔드 미구현 동안에는 mock 응답으로 시작 가능 (예약 페이지 패턴).

---

## 7. 결정 사항

| #   | 항목                          | 결정                                                                                                                                                                                                                          |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7-1 | 탭 상태 보존 위치             | URL query (`?tab=collect`)                                                                                                                                                                                                    |
| 7-2 | 날짜 모드                     | **단일 날짜만** (범위 모드 없음). 정산 탭 = 단일 날짜 / 수금 탭 = 날짜 무관. 통계/트렌드는 주문내역 페이지 책임                                                                                                                |
| 7-3 | 수금 탭 row status            | 수금 탭은 **미수만** 노출 (`/sales/unpaid` 응답에 PAID 포함 안 됨). 결제 취소는 정산 탭 거래 내역에서                                                                                                                          |
| 7-4 | 전일 대비 % 계산 위치         | 백엔드 — `SalesSummary.prevSales` 응답으로 받음. 프론트는 `(totalSales - prevSales) / prevSales * 100` 계산 (단일 날짜만 가능한 단순 비교)                                                                                     |
| 7-5 | 매장 검색                     | client-side filter (현재 페이지 결과 기준)                                                                                                                                                                                    |
| 7-6 | 결제 취소 시 `t_order.status` | PAID → COOKED                                                                                                                                                                                                                 |
| 7-7 | 분할 결제                     | 단일 row 선택 시만 [분할 결제] 버튼 활성. 다이얼로그에서 행 추가 (현금/카드 + 금액) → splits 합계 = 주문금액 일치 시 [완료]. 백엔드: `POST /payments/split { orderSeq, splits: [{ payType, amount }] }`                         |
| 7-8 | 미수 정의 (탭별 분리)         | 정산 탭 KPI `unpaid` = **그날 미수** (그날 주문 중 미결제) / 수금 탭 list = **모든 미수** (날짜 무관, 누적). 두 endpoint 분리: `/sales/summary` 가 그날 미수 / `/sales/unpaid` 가 누적 미수                                    |

## 8. 디자인 편차 / 메모

| 항목             | 피그마                           | 결정                                                                  |
| ---------------- | -------------------------------- | --------------------------------------------------------------------- |
| 탭 표시          | underline (활성 탭 아래 진한 선) | `BTabs variant="outline"` 또는 underline 신규 variant — **결정 필요** |
| KPI 카드 5칸     | grid 5등분                       | `grid grid-cols-5 gap-4`                                              |
| 결제방식 chip 색 | 미수=red, 현금=green, 카드=blue  | severity 별 매핑 (theme.css 확장)                                     |
| pagination 표시  | "총 N건 [10건▾] · < 1 2 3 4 5 >" | PrimeVue DataTable 의 `paginatorTemplate` 으로 커스텀                 |
| 수금 탭 액션 바  | 페이지 하단 sticky               | `sticky bottom-0 bg-white` 또는 별도 footer                           |

---

## 9. 트레이드오프

### 단일 페이지 / 두 탭 vs 별도 라우트

- 단일 페이지 (현재 결정): 헤더/날짜 공유 자연 / 탭 전환 빠름 / 코드 한 곳
- 별도 라우트: 각 탭 직접 진입 가능 / 라우터 history 활용

→ 단일 페이지 + URL query 가 베스트.

### 서버 페이지네이션 vs 클라이언트

- 서버: 거래량 많을 때 안전 (수년치 검색 등)
- 클라이언트: 단순, 정렬/필터 즉시
- 일/주/월 단위 조회라 row 수 적음 → 클라이언트 유지 가능. 단 월 단위 + 매장 많으면 부담

→ **단일 일자는 클라이언트 / 월 단위는 서버**. 단계 2 에서 구체화.

---

## 10. 협업 규약 준수

- 코딩 가이드라인: import 그룹 / `c` prefix computed / `B*` 컴포넌트 ✅
- 디자인 편차 허용 (§8 표) ✅
- prime-vue 가이드: DataTable selection / Paginator 첫 사용 시 [docs/instruct/prime-vue.md](../instruct/prime-vue.md) 참고 ✅
- 협업 §1: 스타일 디버깅 시 사용자 DevTools 확인 후 targeted 수정 ✅
