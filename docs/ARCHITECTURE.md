# Architecture

Cheonil Restaurant Next 프로젝트 기술 아키텍처. 도메인 로직 제외, 구조와 기술 스택 중심.

> 새 세션에서 코드 베이스 파악 시 이 문서부터 읽을 것.

---

## 1. Tech Stack

| 영역                 | 라이브러리                                           |
| -------------------- | ---------------------------------------------------- |
| **Framework**        | Vue 3.6 (`<script setup>`, beta) + TypeScript        |
| **Build**            | Vite 8 + `@vitejs/plugin-vue`                        |
| **Routing**          | vue-router                                           |
| **State (server)**   | TanStack Vue Query 5 (`@tanstack/vue-query`)         |
| **State (client)**   | Pinia 3 + `pinia-plugin-persistedstate`              |
| **UI Library**       | PrimeVue 4.5 + `@primeuix/themes` (Aura preset 기반) |
| **Forms**            | `@primevue/forms` + `zod` (zodResolver)              |
| **Styling**          | Tailwind CSS v4 (`@theme` 디렉티브) + Sass (nested)  |
| **HTTP**             | axios + qs (배열 콤마 직렬화)                        |
| **Tooltip/Popover**  | floating-vue (theme: `cheonil-tooltip`)              |
| **Icons**            | lucide-vue-next                                      |
| **Date**             | date-fns + date-fns-tz                               |
| **Reactivity utils** | `@vueuse/core`                                       |
| **Lint/Format**      | oxlint + eslint + oxfmt                              |
| **Test**             | vitest (unit) + Playwright (e2e)                     |

---

## 2. Folder Structure

```
src/
├── apis/                    # HTTP 호출 (resource-oriented, axios)
├── base-components/         # B* 디자인 시스템 프리미티브 (BButton, BTabs)
├── components/              # 앱 공통 컴포넌트 + 페이지 콜로케이션
│   ├── card/                #   다중 페이지 공유 카드
│   ├── dialog/
│   ├── grid/
│   ├── panel/               #   복합 패널 (서브 컴포넌트 하위 폴더 구성)
│   └── orders-monitor/      #   특정 페이지 전용 (콜로케이션)
├── composables/             # use* UI 훅 (1 파일 1 훅)
├── constants/               # 도메인 상수
├── data/dummy/              # 더미 데이터 팩토리 (백엔드 미구현 대체)
├── layouts/                 # 레이아웃 (AppLayout) + 그 sub-components
├── pages/                   # 라우트 페이지
│   ├── dev/components/      #   B* 컴포넌트 프리뷰 케이스
│   ├── examples/css/        #   CSS 패턴 케이스 (라우트 직접 진입)
│   └── master/
├── queries/                 # TanStack Query 훅 (resource-oriented)
├── router/                  # 라우트 정의 + NAV_GROUPS
├── stores/                  # Pinia 스토어
├── style/                   # Tailwind theme + Sass globals + PrimeVue preset
├── types/                   # 도메인 타입 (Order, Menu 등)
└── utils/                   # 순수 유틸 (formatters, cn)
```

### 콜로케이션 정책 (하이브리드)

- **2개+ 페이지 공유** → `src/components/<type>/` (예: `card/`, `grid/`)
- **1개 페이지 전용** → `src/components/<page-name>/` (예: `orders-monitor/`)
- **dev/examples** → `src/pages/<page>/components/` 또는 `src/pages/<page>/<subdir>/` (페이지 내부 폴더)

판단 기준: **확신 안 서면 페이지 콜로케이션** → 나중에 재사용 필요해지면 옮기기 (반대보다 쉬움)

---

## 3. Auto-imports

[vite.config.ts](../vite.config.ts)에서 `unplugin-auto-import` + `unplugin-vue-components` 설정.

### `unplugin-auto-import` (글로벌 함수/훅)

- **자동 import**: `vue`, `vue-router`, `pinia`, `@vueuse/core`의 모든 export
- **자동 import**: `src/composables/`, `src/stores/` 하위 export
- 결과: `src/auto-imports.d.ts`
- → 코드에서 `ref`, `computed`, `useRouter`, `useToast` 등을 명시적 import 없이 사용 가능 (해도 무방)

### `unplugin-vue-components` (컴포넌트)

- **자동 import**: `src/components/**`, `src/base-components/**`, PrimeVue 컴포넌트 전체
- 결과: `src/components.d.ts`
- → 템플릿에서 `<BButton>`, `<Menu>`, `<OrderReadyCard>` 등 import 없이 사용

### 주의

- 새 컴포넌트 만들면 `src/components.d.ts` 자동 갱신 (dev server 재시작 필요시)
- 명시적 import도 가능 (콜로케이션 경로상 명시 import이 명확할 때 추천)

---

## 4. 핵심 레이어 구조

### 데이터 흐름

```
API (HTTP)  →  Query (캐시/Mutation)  →  Page/Component
                       ↑↓
                   Pinia (UI 상태)
                       ↑↓
                   Composables (UI 훅)
```

### 4-1. `apis/` — HTTP 호출

- **책임**: 서버와의 데이터 송수신만. 비즈니스 로직 없음.
- **네이밍**: `<resource>Api.ts` (resource-oriented, 한 파일에 여러 함수)
- **함수명**: `fetchList`, `fetchById`, `create`, `update`, `remove` (resource명 중복 X)
- **import 스타일**: 네임스페이스 — `import * as menusApi from '@/apis/menusApi'`
- **공통 인스턴스**: [src/apis/api.ts](../src/apis/api.ts) — JWT 인터셉터, qs arrayFormat: 'comma'
- **Payload 타입**: `<Resource>CreatePayload`, `<Resource>UpdatePayload`, `<Resource>ListParams` 등은 같은 `Api.ts` 파일에 둠 (호출 계약)

### 4-2. `queries/` — TanStack Query 래핑

- **책임**: useQuery/useMutation 래핑, 부가 로직 (정렬·invalidate 트리거)
- **네이밍**: `<resource>Query.ts` (한 파일에 여러 훅 공존)
- **queryKey**: [queryKeys.ts](../src/queries/queryKeys.ts) 중앙화 — 계층 키 사용 (`['orders', 'monitor']`로 prefix invalidate 활용)
- **staleTime**: 기본 5분 ([main.ts](../src/main.ts))
- **WebSocket 정책**: mutation은 invalidate **없이** 정의 — WS 도입 후 캐시 동기화는 WS 이벤트가 담당 (현재는 일부 mutation에서 임시로 invalidate 사용 중, TODO 주석)

### 4-3. `composables/` — UI 훅

- **책임**: UI/DOM 관련 재사용 훅 (서버 무관)
- **네이밍**: `use<기능>.ts` (hook-oriented, **1 파일 1 훅 원칙**)
- **lifecycle**: setup root scope에서만 호출, side effect는 `onUnmounted`/`useEventListener`로 cleanup
- **예**: `useAutoFocus`, `useSearchFilter`, `useElapsedTime`

### 4-4. `stores/` — Pinia (UI/cross-page 상태)

- **책임**: 컴포넌트 lifecycle을 넘는 클라이언트 상태
- **네이밍**: `<도메인>Store.ts`, hook은 `use<도메인>Store`
- **스타일**: setup function 형식 (composition API 스타일)
- **사용 시점**:
  - 여러 페이지 간 상태 공유 (예: `orderCartStore` — 수정 진입 시 cross-page hydrate)
  - 페이지 lifecycle 무관 보존 필요 (예: `layoutStore` 사이드바)
  - 새로고침 보존 시 → `{ persist: true }` 옵션 (pinia-plugin-persistedstate)
- **구분**: 단순 페이지 로컬 상태는 `ref` 그대로 — Pinia 강제 X

---

## 5. 컴포넌트 분류

### 5-1. `base-components/` — 디자인 시스템 프리미티브

- **`B*` prefix** (예: `BButton`, `BTabs`)
- **API 축**: `variant × color × size` 3축 고정. 새 variant는 협의 필요, 값만 확장 (collaboration §4)
- **PrimeVue 래퍼** 패턴 — `defineOptions({ inheritAttrs: false })` + `cn()` + Pass-through (`pt`) 재정의
- **모든 페이지에서 사용** 전제 → 어디든 자동 import

### 5-2. `components/` — 앱 공통 / 페이지 콜로케이션

- 2개+ 페이지가 사용하는 것만 type별 폴더 (`card/`, `grid/`)
- 1개 페이지 전용은 페이지명 폴더 (`orders-monitor/`)
- 컴포넌트 루트 요소에 **파일명 기반 kebab-case class** 부여 (selector 명확성)
  - 예: `OrderReadyCard.vue` → `class="order-ready-card"`

### 5-3. `pages/<X>Page.vue` — 라우트 페이지

- `Page` postfix 필수
- 라우트 등록은 [src/router/routes.ts](../src/router/routes.ts)
- nav meta(`group`, `label`, `icon`, `order`, `badge`) 정의 시 사이드바에 자동 노출

---

## 6. Routing & Layout

### 라우트 그룹 ([routes.ts](../src/router/routes.ts))

```ts
NAV_GROUPS = { SALES, SETTLEMENT, MANAGE, DEV };
```

각 라우트의 `meta.nav.group`으로 사이드바 그룹 결정. nav meta 없는 라우트는 사이드바에 안 보임 (예: `/examples/*`).

### 레이아웃 구조

- **`AppLayout`**: 사이드바 + main 영역. 대부분의 라우트가 children
- **standalone 라우트**: AppLayout 외부 (예: `/examples/form`, `/examples/css`) — 사이드바 없음

### KeepAlive 정책

[AppLayout.vue](../src/layouts/AppLayout.vue)에서 그룹 기반 동적 `:include`:

```ts
const cKeepAlivePages = computed(() =>
  route.meta.nav?.group === NAV_GROUPS.SALES ? KEEP_ALIVE_PAGES : [],
);
```

- 영업 그룹 내 이동: 캐시 보존 (페이지 상태 유지)
- 영업 외로 이동: `:include = []` → 캐시 즉시 destroy
- 컴포넌트명은 SFC 파일명에서 자동 유추 (Vue 3 `<script setup>`)
- `onActivated`/`onDeactivated`는 KeepAlive 안에서만 발화 (밖에선 안전하게 무시)

---

## 7. Styling System

### Tailwind v4 + PrimeVue 토큰 브릿지

[src/style/theme.css](../src/style/theme.css)에서 PrimeVue가 런타임 주입하는 `--p-*` 변수를 Tailwind `--color-*` 토큰으로 미러링:

```css
@theme {
  --color-primary-500: var(--p-primary-500);
  --color-surface-100: var(--p-surface-100);
  --color-status-caution: var(--p-amber-500); /* 도메인 별칭 */
}
```

### 도메인 별칭

- `--color-status-caution / warning / danger` — 주문 경과시간 색상 (15분/25분/35분 임계치 기준)

### Text scale (override)

```css
--text-xs: 0.625rem; /* 10px */
--text-sm: 0.75rem; /* 12px */
--text-base: 0.8125rem; /* 13px */
--text-lg: 1rem; /* 16px */
--text-xl: 1.125rem; /* 18px */
```

POS 정보 밀도를 반영해 Tailwind 기본값보다 작게. 상세는 [docs/DESIGN_TOKENS.md](DESIGN_TOKENS.md).

### 컴포넌트 스타일

- 인라인 Tailwind 우선 (`class="..."`)
- 복잡한 스타일은 `<style scoped lang="scss">` (sass nested 허용)
- `cn()` 유틸 ([src/utils/cn.ts](../src/utils/cn.ts)) — clsx + tailwind-merge로 클래스 병합

---

## 8. 네이밍 컨벤션 (요약)

상세는 [docs/instruct/coding-guideLine.md](instruct/coding-guideLine.md). 핵심만:

| 카테고리           | 규칙                                    | 예시                                         |
| ------------------ | --------------------------------------- | -------------------------------------------- |
| **Boolean**        | `is`/`has`/`show`/`use` prefix          | `isLoading`, `hasChanges`                    |
| **Computed**       | `c` prefix                              | `cTotalAmount`, `cIsActive`                  |
| **Event handler**  | `on` prefix + 기본 이벤트명 또는 기능명 | `onClickStore`, `onCreate`                   |
| **Emit**           | on 빼고 사용                            | `emit('delete')`                             |
| **Store instance** | `Store` postfix                         | `const orderCartStore = useOrderCartStore()` |
| **Selected**       | `sel` 약어                              | `selStore`, `selMode`                        |
| **Key-row Object** | `d` prefix (lodash keyBy)               | `dPlace = _.keyBy(places, 'placeId')`        |
| **Map 객체**       | `m` prefix                              | `mPlace = new Map()`                         |
| **Page**           | `<이름>Page.vue`                        | `OrdersPage.vue`                             |
| **Layout**         | `<이름>Layout.vue`                      | `AppLayout.vue`                              |
| **Base 공통**      | `B<이름>.vue`                           | `BButton.vue`                                |
| **API**            | `<resource>Api.ts`                      | `menusApi.ts`                                |
| **Query**          | `<resource>Query.ts`                    | `menusQuery.ts`                              |
| **Composable**     | `use<기능>.ts`                          | `useAutoFocus.ts`                            |
| **Store**          | `<도메인>Store.ts`                      | `orderCartStore.ts`                          |

### Import 정렬 (한 그룹 내 알파벳)

```ts
// 1. store, composable, 기타, package 순  (한 줄 공백)
import { useToast } from "primevue/usetoast";
import { ref } from "vue";

import * as menusApi from "@/apis/menusApi";
import { useMenusQuery } from "@/queries/menusQuery";

import type { Menu } from "@/types/menu";
```

### 약어 테이블

`Mgr` Manager, `Sel` Selected, `Nm` Name, `Prc` Processing, `Btn` Button, `Img` Image, `Ctg` Category, `Cmt` Comment, `Tmpl` Template, `Rsv` Reservation 등. 전체 표는 coding-guideLine.md.

---

## 9. 자주 쓰는 유틸 & 패턴

### Utilities

- **`cn(...classes)`** — clsx + tailwind-merge로 충돌 해결한 클래스 병합
- **`formatWon(n)`** — 한국 원화 표기 (`8,000원`)

### Composables (재사용 훅)

| 훅                                        | 책임                                                           |
| ----------------------------------------- | -------------------------------------------------------------- |
| `useAutoFocus(elt, isActive)`             | active 변화 시 + KeepAlive 재활성화 시 포커스                  |
| `useSearchFilter(items, keyword, getStr)` | 한글 자모 검색 포함 필터링                                     |
| `useElapsedTime(orderAt)`                 | 1분 간격 경과시간 라벨 + 상태 (`fresh/caution/warning/danger`) |

### Tooltip (floating-vue)

```vue
<VTooltip theme="cheonil-tooltip">
  <span tabindex="0">trigger</span>
  <template #popper>...</template>
</VTooltip>
```

테마 정의: [main.ts](../src/main.ts) + [theme.css](../src/style/theme.css)

### Toast / Confirm (PrimeVue)

- App.vue에 `<Toast />`, `<ConfirmDialog />` 마운트됨
- 사용: `useToast()`, `useConfirm()` (locale은 main.ts에서 한글로 설정)

---

## 10. 빌드 / 검증 도구

```bash
npm run dev          # vite (port 4200, /api → http://localhost:8080 proxy)
npm run build        # type-check + build
npm run type-check   # vue-tsc --build
npm run lint         # oxlint + eslint
npm run format       # oxfmt
npm run test:unit    # vitest
npm run test:e2e     # playwright
```

### 코드 검증 흐름 (작업 후)

```bash
npx vue-tsc --build        # 타입 에러 검사
npx oxlint <changed-files> # 정적 분석
```

---

## 11. 참고 문서 인덱스

| 문서                                                                      | 내용                                           |
| ------------------------------------------------------------------------- | ---------------------------------------------- |
| [.claude/CLAUDE.md](../.claude/CLAUDE.md)                                 | 세션 시작 시 자동 로드 (최소 핵심)             |
| [docs/instruct/coding-guideLine.md](instruct/coding-guideLine.md)         | 코딩 컨벤션 상세                               |
| [docs/instruct/claude-collaboration.md](instruct/claude-collaboration.md) | Claude 협업 규약 (의사 신호, 디버깅 역할 분담) |
| [docs/instruct/prime-vue.md](instruct/prime-vue.md)                       | PrimeVue 사용 지침                             |
| [docs/DESIGN_TOKENS.md](DESIGN_TOKENS.md)                                 | 디자인 토큰 (텍스트 스케일, 색상 등)           |
| [docs/DATA_CACHING_PLAN.md](DATA_CACHING_PLAN.md)                         | TanStack Query 캐싱 전략                       |
| [docs/plan/\*.md](plan/)                                                  | 기능별 구현 계획                               |
| [docs/ddl-pg.sql](ddl-pg.sql)                                             | PostgreSQL DDL (백엔드 스키마 참고용)          |

---

## 12. 환경 메타

- **Node**: ^20.19.0 || >=22.12.0
- **TypeScript**: 6.0
- **백엔드 프로젝트**: 별도 디렉토리 `cheonil-restaurant-spring` (Spring Boot)
- **개발 dev server**: http://localhost:4200, /api proxy → http://localhost:8080

---

## 13. WebSocket 도입 예정 (TODO)

현재 일부 mutation은 `invalidateQueries`로 캐시 갱신 중. WS 도입 시:

1. WS subscriber에서 서버 이벤트 수신 (`order:created`, `order:updated`, `order:status-changed`, `order:removed`)
2. 핸들러에서 `queryClient.invalidateQueries({ queryKey: ['orders'] })` 또는 `setQueryData` 호출
3. 모든 mutation의 `onSuccess: invalidateQueries` 제거 (mutation hook은 UX 책임만 — loading/error/사이드 이펙트)

영향받을 mutation: `useOrderStatusMutation`(현재 invalidate 중), `useOrderCreateMutation`, `useOrderUpdateMutation`, `useOrderRemoveMutation` (이 셋은 이미 invalidate 없음).
