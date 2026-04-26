# OrdersPage / OrdersMonitorPage 설계 검토

> 기반 Figma: `lZH7QriZ8dnUOfNhx4D2Mr` / node `4:2`
> 관련 기존 문서: [PAGES.md](./PAGES.md), [LAYOUT_PLAN.md](./LAYOUT_PLAN.md)

Figma에는 총 5개 프레임이 있음 (사이드바 토글 예시 1개 포함). 아래는 구현 착수 전에 확정·점검할 항목 중심 정리.

---

## 1. 화면 구성 요약

### OrdersPage — 매장 선택 → 메뉴 담기 흐름 (Step 1~3)

| Step          | Node ID  | 상태                    | 좌측 컨텐츠                    | 우측 패널                                       |
| ------------- | -------- | ----------------------- | ------------------------------ | ----------------------------------------------- |
| Step 1        | `19:4`   | 매장 미선택 (파란 배너) | 매장 카테고리 탭 + 매장 그리드 | 빈 슬롯 + "매장을 선택하세요" + 비활성 CTA      |
| Step 2        | `19:227` | 매장 선택 (회색 헤더)   | 메뉴 카테고리 탭 + 메뉴 그리드 | 선택된 매장 + "메뉴를 선택하세요" + 비활성 CTA  |
| Step 3        | `19:374` | 카트 채워짐 (녹색 헤더) | 메뉴 그리드 (동일)             | 매장명 + 카트 항목 리스트 + 총계 + 주문완료 CTA |
| 사이드바 축소 | `19:549` | Cmd+B 토글 예시         | -                              | -                                               |

### OrdersMonitorPage — 주문현황 (Step 4)

| Step    | Node ID    | 모드     | 진행 카드 액션      | 완료목록 액션    |
| ------- | ---------- | -------- | ------------------- | ---------------- |
| Step 4  | `2084:2`   | 전체보기 | `btnDone` 완료 버튼 | "완료 취소" 버튼 |
| Step 4' | `2081:344` | 주방용   | 없음 (읽기 전용)    | 취소 불가        |

---

## 2. 컴포넌트 분해안

### 공용 (둘 다 사용)

- `CategoryTabs` — 매장 카테고리 / 메뉴 카테고리 공통 (탭 스타일 동일)
- `SegmentTabs` — 전체보기 / 주방용 (OrdersMonitor)

### OrdersPage

- `StoreCard` — 매장 그리드 카드 (202×96: 이름 + ⓘ + 카테고리 배지)
- `MenuCard` — 메뉴 그리드 카드 (202×110: 이름 + 가격)
- `OrderCartPanel` — 우측 패널 (상태별 렌더 분기)
  - `CartItemRow` — 이름/단가 / `−` / 수량 / `+` / 소계
  - `CartSummary` — 총 건수 + 총 금액
- `StoreSelectedHeader` — 🏪 아이콘 + 매장명 + 리셋 버튼

### OrdersMonitorPage

- `ProgressOrderCard` (388×300) — 주문 카드
  - props: `showDoneButton` (주방용은 false)
  - 슬롯/부분: `h`(매장명+⋮) / `tr`(🕐시각+경과뱃지) / `items` 그리드 / `memo`(옵션) / `btnDone`
- `OrderItemRow` (`ir`) — 메뉴명 + 수량 뱃지(×N)
- `ElapsedBadge` — 경과시간 뱃지 (색상 상태 포함, [theme.css](../src/style/theme.css) 의 `--color-status-*` 토큰 재사용 가능)
- `DoneOrderCard` (388×140) — 완료 카드
  - props: `cancelable` (주방용은 false)

---

## 3. 🔴 확정 필요 (Blocking)

### 3.1 세트 메뉴 플로우 — **설계 누락**

- Figma에 **세트 선택 다이얼로그 / 구성 메뉴 선택 플로우 없음**
- 모든 메뉴 카드가 단품형 (이름 + 가격) 만 존재
- 기존 `Cheonil-Restaurant/docs/ORDER_PROCESS.md` 에 세트 처리 로직이 있다면 참고 필요
- **결정 필요**: 세트도 단품처럼 한 번에 담는 방식 vs 다이얼로그로 구성 선택 방식

### 3.2 라우트 경로 불일치

- [PAGES.md](./PAGES.md) 계획: `/orders`, `/order-monitors`
- 방금 작성한 [router/index.ts](../src/router/index.ts): `/` (root), `/orders/monitor`
- **결정 필요**: 어느 쪽으로 통일할지 (PAGES.md 따라갈 것을 추천)

### 3.3 파일명 불일치

- PAGES.md: `OrderPage.vue`, `OrderMonitorPage.vue` (단수)
- 실제 파일: `OrdersPage.vue`, `OrdersMonitorPage.vue` (복수)
- **결정 필요**: rename 여부

---

## 4. 🟡 데이터·상태 설계 검토

### 4.1 경과시간 상태 색상

- 배너 문구: 0~14분 기본 / 15분+ caution / 25분+ warning / 35분+ danger
- [theme.css](../src/style/theme.css) 에 이미 토큰 정의됨: `--color-status-caution/warning/danger`
- 기존 [OrderStateView.vue](../../Cheonil-Restaurant/src/views/OrderStateView.vue) 의 `ELPASED_MINUES_INFO` 로직 재사용 가능한지 확인

### 4.2 실시간 동기화

- 배너에 "WebSocket `/api/order`" 명시됨
- WS 레이어가 `cheonil-restaurant-next`에 아직 없음 → 구성 필요
- **결정 필요**: 기존 프로젝트의 WS 코드 포팅 vs 신규 작성 (Pinia + `@vueuse/core` useWebSocket)

### 4.3 카트 상태 관리

- OrdersPage 우측 패널 상태가 3단계 (빈 → 매장선택 → 카트있음)
- 페이지 내 ref로 충분 vs Pinia store 분리
- **권장**: Pinia store (`useOrderCartStore`) — 페이지 이탈 후 복귀해도 카트 유지 가능

### 4.4 카테고리 탭 데이터

- 매장 카테고리: 중앙/농협/대양/원예/외부/효성/글로벌/관련상가
- 메뉴 카테고리: 식사/찌개/탕/구이/면/음료
- 기존 `StoreCtg`, `MenuCtg` 엔티티와 매칭되는지 확인 ([ddl-pg.sql](./ddl-pg.sql))

---

## 5. 🟢 명확한 구현 항목

- [ ] `OrdersPage` 3-column 레이아웃 (사이드바는 AppLayout 소유, 중앙 + 우측)
- [ ] 매장/메뉴 그리드 — 같은 Grid 컴포넌트에 카드 slot 주입
- [ ] 카트 수량 조절(`−`/`+`) — 0 되면 제거
- [ ] 주문완료 버튼 disabled 조건: 매장 미선택 OR 카트 0건
- [ ] `OrdersMonitorPage` — 전체보기/주방용 세그먼트 탭으로 카드 variant 전환
- [ ] 경과시간 1분 단위 업데이트 (`setInterval` 또는 `@vueuse/core` `useNow`)
- [ ] 완료 처리 / 완료 취소 API 연결

---

## 6. 추가로 받으면 좋을 Figma 자산

- 세트 메뉴 다이얼로그 디자인 (위 3.1 관련)
- 에러 / 빈 상태 (WS 끊김, 주문 실패 등) 별도 프레임이 있는지
- 모바일/태블릿 레이아웃 고려 여부 (현재는 1920×1080 기준)
- 주문 카드의 `memo` (요청사항) 입력 UI — 어디서 작성하는지

---

## 7. 제안 진행 순서

1. **3장 Blocking 항목 확정** (세트 플로우, 라우트, 파일명)
2. `OrdersPage` 정적 레이아웃 + 더미 데이터로 UI 먼저 (카트 상태 Pinia)
3. 매장/메뉴 API 연동 → 실데이터 렌더
4. 주문 생성 API 연동 → `OrdersMonitorPage` 로 이동
5. `OrdersMonitorPage` 정적 UI → 주문 조회 API 연동
6. 경과시간 타이머 + 상태 색상
7. WebSocket 실시간 동기화 레이어
8. 주방용 모드 분기
