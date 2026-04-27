# 데이터 캐싱 — TanStack Query 적용

> 선행 문서: [ORDERS_PAGE_IMPL_PHASE2.md](./ORDERS_PAGE_IMPL_PHASE2.md)
> 결정: **TanStack vue-query** 채택 (DIY Pinia store 팩토리 방안은 폐기)

---

## 0. 배경

### 캐싱 대상 — 마스터 데이터
자주 조회, 드물게 변경되는 데이터. 앱 생애주기 동안 1회 fetch + 변경 시 재검증.

| 리소스 | API | Query 훅 |
|---|---|---|
| 메뉴 | `menusApi.fetchList()` | `useMenusQuery()` |
| 메뉴 카테고리 | `menuCtgsApi.fetchList()` | `useMenuCtgsQuery()` |
| 매장 | `storesApi.fetchList()` | `useStoresQuery()` |
| 매장 카테고리 | `storeCtgsApi.fetchList()` | `useStoreCtgsQuery()` |

### 캐싱 비대상
- **주문 작성 상태** (cart/memo/selStore) — OrdersPage 전용 ref
- **주문 내역** — 페이지별 필터 조건 상이
- **결제/지출** — 실시간 트랜잭션

---

## 1. 왜 vue-query 인가

### DIY 방식의 문제점
- 4개 store 마다 `ensureLoaded/invalidate/refresh/isLoading` 중복
- 재시도 / stale-while-revalidate / dedup 직접 구현 필요
- mutation + 낙관적 업데이트 패턴 수작업

### vue-query 가 해주는 것
- 자동 캐싱 + dedup
- 재시도 (기본 3회, 조정 가능)
- stale-while-revalidate (백그라운드 refetch)
- `useMutation` + `onSuccess invalidate` 로 CRUD 깔끔
- 전용 DevTools — 쿼리 상태 시각화

### 트레이드오프
- 번들 +~40KB gzip (허용 범위)
- 러닝 커브 한 번 (하지만 업계 표준)

---

## 2. 설정 — `main.ts`

```ts
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5분간 fresh — 재호출 네트워크 생략
      refetchOnWindowFocus: false,  // POS 환경에서 창 전환 잦음 — 끔
      retry: 1,                     // 실패 시 1회 재시도
    },
  },
})
app.use(VueQueryPlugin, { queryClient })
```

### `staleTime` 결정
- POS 마스터 데이터는 **자주 바뀌지 않음** — 5분 fresh 충분
- 관리 페이지에서 변경 시 `invalidateQueries` 로 즉시 재로드
- `staleTime` 을 `Infinity` 로 하면 수동 invalidate 필요 시점까지 절대 재요청 — 고려해볼 만

### `refetchOnWindowFocus`
기본 true. POS 는 창 전환 잦아서 끄는 게 맞음.

### DevTools (선택)

```ts
// App.vue 에서
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

<template>
  <RouterView />
  <VueQueryDevtools />  <!-- dev 모드에서만 렌더링, 플로팅 버튼 -->
</template>
```

프로덕션 빌드에선 자동 제외.

---

## 3. Query Key 관리

중앙화된 상수 파일 하나에 정의 — invalidate 시 참조 통일.

```ts
// src/queries/queryKeys.ts
export const QUERY_KEYS = {
  menus: ['menus'] as const,
  menuCtgs: ['menuCtgs'] as const,
  stores: ['stores'] as const,
  storeCtgs: ['storeCtgs'] as const,
} as const
```

### 파라미터가 있는 쿼리 (미래 예시)

```ts
menu: (seq: number) => ['menu', seq] as const,
ordersByStore: (storeSeq: number) => ['orders', 'byStore', storeSeq] as const,
```

`queryKey` 는 배열로 JSON-serializable 해야 함.

---

## 4. Query 훅

### 기본 패턴

```ts
// src/queries/menusQuery.ts
import { useQuery } from '@tanstack/vue-query'
import * as menusApi from '@/apis/menusApi'
import { QUERY_KEYS } from './queryKeys'

export function useMenusQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.menus,
    queryFn: () => menusApi.fetchList(),
  })
}
```

반환값:
```ts
{
  data: Ref<Menu[] | undefined>,      // 데이터
  isLoading: Ref<boolean>,            // 최초 로드 중
  isFetching: Ref<boolean>,           // 모든 fetch (백그라운드 포함)
  isError: Ref<boolean>,
  error: Ref<Error | null>,
  refetch: () => Promise<...>,        // 수동 재호출
}
```

### 컴포넌트 사용

```ts
const { data: menus } = useMenusQuery()

// 템플릿
:menus="menus ?? []"  // undefined (로딩) 대비 fallback
```

또는 로딩 분기:
```vue
<div v-if="isLoading">로딩 중…</div>
<MenuGrid v-else :menus="menus" :categories="menuCategories" ... />
```

---

## 5. Mutation 패턴 (관리 페이지용, 2차)

### 예: MenusPage 에서 메뉴 수정

```ts
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import * as menusApi from '@/apis/menusApi'
import { QUERY_KEYS } from '@/queries/queryKeys'

const queryClient = useQueryClient()

const updateMutation = useMutation({
  mutationFn: (payload: { seq: number; data: Partial<Menu> }) =>
    menusApi.update(payload.seq, payload.data),
  onSuccess: () => {
    // 성공 시 menus 쿼리 자동 재로드
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menus })
  },
})

// 사용
function onSave(menu: Menu) {
  updateMutation.mutate({ seq: menu.seq, data: { price: 9000 } })
}
```

### Optimistic Update (선택)

```ts
const updateMutation = useMutation({
  mutationFn: ...,
  onMutate: async (newMenu) => {
    await queryClient.cancelQueries({ queryKey: QUERY_KEYS.menus })
    const previous = queryClient.getQueryData(QUERY_KEYS.menus)
    queryClient.setQueryData(QUERY_KEYS.menus, (old: Menu[]) =>
      old.map((m) => (m.seq === newMenu.seq ? { ...m, ...newMenu } : m)),
    )
    return { previous }
  },
  onError: (_err, _newMenu, context) => {
    // 실패 시 롤백
    queryClient.setQueryData(QUERY_KEYS.menus, context?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menus })
  },
})
```

즉각 반영 + 실패 시 롤백. 관리 페이지 UX 향상용.

---

## 6. 사용 규칙

### 규칙 1 — API 호출은 쿼리 훅 경유
페이지에서 `menusApi.fetchList()` 직접 호출 금지. `useMenusQuery()` 사용.

**예외**: 일회성 조회 (예: 검증용) — `queryClient.fetchQuery` 또는 직접 API.

### 규칙 2 — 변경 후 invalidate 필수
`useMutation` 의 `onSuccess` 에 `queryClient.invalidateQueries({ queryKey: QUERY_KEYS.xxx })` 항상 포함.

### 규칙 3 — Query Key 는 `queryKeys.ts` 에서만
하드코딩 금지. 모든 key 는 상수 참조.

---

## 7. 영향 범위

### 신규 파일
```
src/queries/
  queryKeys.ts           — 모든 쿼리 키 상수
  menusQuery.ts          — useMenusQuery
  menuCtgsQuery.ts       — useMenuCtgsQuery
  storesQuery.ts         — useStoresQuery
  storeCtgsQuery.ts      — useStoreCtgsQuery
```

### 수정
- [main.ts](../src/main.ts) — QueryClient + VueQueryPlugin 등록
- [OrdersPage.vue](../src/pages/OrdersPage.vue) — `onMounted` 의 API 직접 호출 → query 훅

---

## 8. 결정 기록

| 항목 | 결정 | 대안 | 사유 |
|---|---|---|---|
| 라이브러리 | TanStack vue-query | DIY Pinia 팩토리 | 업계 표준, mutation 패턴 등 장기 투자 가치 |
| staleTime | 5분 | 0 / Infinity | 마스터 데이터 변경 빈도 반영 |
| refetchOnWindowFocus | false | true (기본) | POS 창 전환 잦음 |
| retry | 1 | 3 (기본) | 네트워크 안정 가정, 빠른 실패 노출 |
| Query Key | 상수 파일 중앙화 | 각 훅에서 inline | invalidate 참조 통일 |
| DevTools | 포함 (`@tanstack/vue-query-devtools`) | 미포함 | 개발 경험 향상, prod 자동 제외 |
| 서버 상태와 UI 상태 분리 | 엄격히 | cart 도 vue-query 로? | 서버 상태 아닌 것은 vue-query 범위 밖 |

---

## 9. 이후 확장

### 관리 페이지 구현 시
- `useMutation` 패턴으로 CRUD 일관화
- Optimistic update 적용 (리스트 리오더, 카테고리 수정)
- `queryClient.invalidateQueries` 로 자동 재로드

### OrdersMonitorPage 실시간성
- `refetchInterval: 5000` 같은 옵션으로 polling
- 또는 WebSocket 으로 서버 push 받으면 `queryClient.setQueryData` 로 캐시 업데이트

### 파라미터 쿼리
- `useOrdersByStoreQuery(storeSeq)` 같이 매장별 주문 리스트
- queryKey 에 파라미터 포함 — 자동으로 매장별 독립 캐시

---

## 10. 참고

- [TanStack Query Vue 공식 문서](https://tanstack.com/query/latest/docs/framework/vue/overview)
- `useQuery` / `useMutation` / `useQueryClient` API
- DevTools 사용 가이드
