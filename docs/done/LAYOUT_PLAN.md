# 레이아웃 구현 방안

> Figma `Order Flow` 페이지의 Step1–4 화면 공통 레이아웃을 기준으로 작성.
> 참고 노드: [Step2_매장선택후 `19:227`], [사이드바_축소상태_예시 `19:549`].

## 1. 화면 구조 (Figma 기준)

```
┌────────────────────────────────────────────────────────────┐
│  Sidebar(220 / 64)  │          Main (slot)                 │
│                     │                                      │
│  logo  [toggle ‹]   │  <router-view />                     │
│  ──────             │                                      │
│  [영업]             │                                      │
│   🍽  주문           │                                      │
│   📋  주문현황       │                                      │
│  ──────             │                                      │
│  [정산]             │                                      │
│   📊  정산           │                                      │
│   💰  수금           │                                      │
│  ──────             │                                      │
│  [관리]             │                                      │
│   📝  주문내역       │                                      │
│   💸  지출내역       │                                      │
│   🍱  제품관리       │                                      │
│   🥬  식자재관리     │                                      │
│   ➕  메뉴 등록      │                                      │
│   🏪  매장 등록      │                                      │
│                     │                                      │
│  (spacer)           │                                      │
│  [관] 관리자 ⋯      │                                      │
└────────────────────────────────────────────────────────────┘
```

- **Expanded**: 220px (로고 + 라벨 + 그룹 헤더 노출)
- **Collapsed**: 64px (아이콘만, 그룹 헤더는 구분선으로 대체)
- 상단 banner 는 Figma 프로토타입용 설명 배너이므로 **실구현에서 제외**

## 2. 파일 구성

```
src/
  layouts/
    AppLayout.vue                   ← 쉘: 사이드바 + <router-view />
    components/
      AppSidebar.vue                ← 확장/축소 상태 모두 담당
      AppSidebarItem.vue            ← 단일 nav 아이템 (아이콘 + 라벨 + active)
      AppSidebarGroupHeader.vue     ← 그룹 헤더 ("영업"/"정산"/"관리")
      AppSidebarUser.vue            ← 하단 사용자 카드
  stores/
    layoutStore.ts                  ← 사이드바 상태 (persist)
  router/
    index.ts                        ← 중첩 라우트로 레이아웃 적용
  views/
    (기존 views/examples/ 유지 + 아래 스텁 추가)
    order/OrderView.vue             ← 스텁
    order/OrderStateView.vue        ← 스텁
    (나머지 메뉴는 라우트만 만들고 View 는 추후)
```

## 3. 스토어 설계 — `layoutStore.ts`

```ts
export const useLayoutStore = defineStore(
  'layout',
  () => {
    const sidebarCollapsed = ref(false)
    const toggleSidebar = () => { sidebarCollapsed.value = !sidebarCollapsed.value }
    return { sidebarCollapsed, toggleSidebar }
  },
  { persist: true },   // pinia-plugin-persistedstate 사용
)
```

- 브레이크포인트에서 자동 축소 같은 반응형 로직은 **1차 구현 범위 밖** (후속 개선)
- `main.ts` 에서 `pinia.use(piniaPluginPersistedstate)` 활성화 필요

## 4. 라우터 재구성

```ts
routes: [
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: '', redirect: { name: 'order' } },

      // 영업
      { path: 'order',         name: 'order',        component: () => import('@/views/order/OrderView.vue') },
      { path: 'order-status',  name: 'order-status', component: () => import('@/views/order/OrderStateView.vue') },

      // 정산
      { path: 'account',       name: 'account',      component: () => import('@/views/stub.vue') },
      { path: 'collection',    name: 'collection',   component: () => import('@/views/stub.vue') },

      // 관리
      { path: 'order-history', name: 'order-history', component: () => import('@/views/stub.vue') },
      { path: 'expense',       name: 'expense',       component: () => import('@/views/stub.vue') },
      { path: 'product',       name: 'product',       component: () => import('@/views/stub.vue') },
      { path: 'supply',        name: 'supply',        component: () => import('@/views/stub.vue') },
      { path: 'menu',          name: 'menu',          component: () => import('@/views/stub.vue') },
      { path: 'store',         name: 'store',         component: () => import('@/views/stub.vue') },

      // 예시
      { path: 'examples/form', name: 'example-form', component: () => import('@/views/examples/FormExample.vue') },
    ],
  },
]
```

- 스텁(`views/stub.vue`): 한 파일에 `route.meta.title` 찍어주는 임시 페이지 → 사이드바 클릭 검증용
- 라우트 이름 컨벤션: kebab-case (active 매칭용 ID 로도 사용)

## 5. 사이드바 설계 — `AppSidebar.vue`

### 데이터 구조

```ts
type NavItem = { label: string; icon: string; to: string }
type NavGroup = { heading: string; items: NavItem[] }

const NAV: NavGroup[] = [
  { heading: '영업', items: [
    { label: '주문',     icon: 'pi-shop',       to: '/order' },
    { label: '주문현황', icon: 'pi-clipboard-check', to: '/order-status' },
  ]},
  { heading: '정산', items: [
    { label: '정산', icon: 'pi-chart-bar', to: '/account' },
    { label: '수금', icon: 'pi-wallet',    to: '/collection' },
  ]},
  { heading: '관리', items: [
    { label: '주문내역',   icon: 'pi-book',       to: '/order-history' },
    { label: '지출내역',   icon: 'pi-money-bill', to: '/expense' },
    { label: '제품관리',   icon: 'pi-box',        to: '/product' },
    { label: '식자재관리', icon: 'pi-apple',      to: '/supply' },
    { label: '메뉴 등록',  icon: 'pi-plus-circle',to: '/menu' },
    { label: '매장 등록',  icon: 'pi-home',       to: '/store' },
  ]},
]
```

### 렌더링 규칙

- `sidebarCollapsed=false` → 그룹 헤더 + 아이콘 + 라벨
- `sidebarCollapsed=true`  → 그룹 헤더 대신 24px `<hr>` 구분선, 라벨 숨김
- Active 표시: `<RouterLink>`의 `active-class="bg-primary-500 text-white"` (Figma 패턴과 일치)
- 호버: `hover:bg-surface-100`
- Transition: width 150ms ease (확장/축소 애니메이션)
- 하단 user 카드는 `mt-auto` 로 push

### 사이즈 토큰 (Figma 기준)

| 항목 | Expanded | Collapsed |
|---|---|---|
| 사이드바 폭 | 220px | 64px |
| 아이템 높이 | 44px | 44px |
| 아이콘 크기 | 16px | 16px |
| 아이템 가로 패딩 | 12px (아이콘 기준) | 중앙 정렬 |
| 라벨 폰트 | 13px Medium (active: Semi Bold) | 숨김 |
| 그룹 헤더 | 11px Semi Bold, muted color | 구분선으로 대체 |

## 6. PrimeVue 컴포넌트 매핑

| 요소 | 사용 | 비고 |
|---|---|---|
| 사이드바 컨테이너/아이템 | 순수 div + `RouterLink` | PrimeVue `Menu` 는 스타일 자유도 낮아 사용 안 함 |
| Toggle 버튼 | `<Button>` (severity=secondary, text, rounded) | `pi-angle-left/right` 아이콘 |
| 아이콘 | `<i class="pi pi-*">` | PrimeIcons 사용 (이모지 대체) |
| 사용자 아바타 | 순수 div 원형 | 추후 `Avatar` 로 교체 가능 |
| Toast/Confirm | `<Toast />`, `<ConfirmDialog />` | 이미 App.vue 루트에 배치됨 |

## 7. 아이콘 전략

- Figma 이모지(🍽/📋/💰 …)는 플랫폼 폰트에 의존해 일관성이 떨어짐
- **PrimeIcons 로 교체** (이미 설치됨) — `pi-clipboard-check`, `pi-shop`, `pi-wallet` 등
- 매핑표는 `AppSidebar.vue` 내부 `NAV` 상수에 명시

## 8. 반응형 / 접근성 (1차 구현 범위 밖, 후속)

- `md:` 미만에서 drawer 모드로 전환 (overlay + 백드롭)
- 키보드 네비게이션 (사이드바 Tab 순서, Esc 로 drawer 닫기)
- `aria-current="page"` 로 active 라우트 표시
- 사이드바 폭 애니메이션은 `prefers-reduced-motion` 존중

## 9. 구현 순서 (제안)

1. `main.ts` — pinia-plugin-persistedstate 활성화
2. `stores/layoutStore.ts` — 상태 스토어
3. `layouts/components/` — 사이드바 하위 컴포넌트 3개
4. `layouts/AppSidebar.vue` — 사이드바 조립
5. `layouts/AppLayout.vue` — 쉘 + `<router-view />`
6. `router/index.ts` — 중첩 라우트 적용 + 스텁 라우트 추가
7. `views/stub.vue` — 임시 페이지
8. dev 서버 띄워서 사이드바 클릭 동작/active 스타일 검증
9. 토큰 적용 상태(`bg-primary-500`, `border-surface-200` 등) 시각 확인

## 10. 검증 체크리스트

- [ ] Expanded ↔ Collapsed 토글 동작 + 새로고침해도 유지
- [ ] 각 메뉴 클릭 시 URL 변경 + active 스타일 적용
- [ ] PrimeIcons 정상 로드 (흰색 사각형 아님)
- [ ] Tailwind `bg-primary-*` / `text-surface-*` 가 Cheonil 그린/슬레이트로 렌더
- [ ] 사이드바 폭 전환 애니메이션 깜빡임 없음
- [ ] 브라우저 `localStorage.layout` 에 상태 저장 확인

## 11. 미정/논의 필요

- **로고**: Figma 는 🍽 + "천일식당". 실제 SVG 로고가 있다면 교체
- **user 카드**: 현재는 모의 정보. 실제 인증 붙으면 `authStore` 연결 필요
- **사이드바 브랜치**: Figma 에는 expanded/collapsed 만 있지만, 모바일용 drawer 가 따로 필요한지
- **그룹 헤더 네이밍**: 영업/정산/관리 3 그룹 유지 vs 세분화
