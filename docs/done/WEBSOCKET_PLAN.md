# 수정

## SSE로 최종 구현됨.

# WebSocket 도입 계획

여러 사용자가 동시에 사용하는 POS 환경에서 **주문 상태 변화를 실시간으로 모든 클라이언트에 전파**하기 위한 계획.

> 관련 문서: [ARCHITECTURE.md §13](ARCHITECTURE.md), [DATA_CACHING_PLAN.md](DATA_CACHING_PLAN.md)

---

## 1. 도입 배경

현재 [TanStack Query](../src/queries/ordersQuery.ts) mutation들은:

- 일부는 임시로 `invalidateQueries`로 캐시 동기화 (`useOrderStatusMutation`)
- 일부는 invalidate 없음 (`useOrderCreateMutation`, `useOrderUpdateMutation`, `useOrderRemoveMutation`)

**한계**:

- 본인 액션만 캐시 갱신됨 — 다른 사용자가 처리한 변경은 새로고침 전까지 안 보임
- 주문현황 모니터는 본질적으로 **실시간 공유 화면** — 주방 직원이 완료 처리하면 카운터에서 즉시 사라져야 함

→ **WS push로 모든 변경을 모든 클라이언트에 broadcast**.

---

## 2. WS로 처리할 이벤트 목록

### 2-1. 주문 도메인 (필수)

| 이벤트                 | 발생 시점                         | Payload (예상)                                                   | 클라이언트 영향                                   |
| ---------------------- | --------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| `order:created`        | POST `/orders` 성공               | `OrderExt` (전체 aggregate)                                      | 모니터의 진행 중 섹션에 카드 추가                 |
| `order:updated`        | PUT `/orders/{seq}` 성공          | `OrderExt`                                                       | 해당 카드 내용 갱신 (메뉴/금액/메모)              |
| `order:status-changed` | PATCH `/orders/{seq}/status` 성공 | `OrderStatusChangeResult` (`seq`, `status`, `cookedAt`, `modAt`) | 카드 섹션 이동 (READY ↔ COOKED) 또는 PAID 시 제거 |
| `order:removed`        | DELETE `/orders/{seq}` 성공       | `{ seq: number }`                                                | 해당 카드 제거                                    |

이벤트 네이밍 규칙: `<도메인>:<액션>` (콜론 구분).

---

## 3. Backend 인터페이스 (합의 필요)

### 3-1. 프로토콜 선택지

| 옵션                        | 장점                                                                       | 단점                             |
| --------------------------- | -------------------------------------------------------------------------- | -------------------------------- |
| **STOMP over WebSocket** ⭐ | Spring `spring-messaging` 1급 지원, topic 기반 pub/sub, 메시지 라우팅 표준 | 별도 STOMP 클라이언트 필요       |
| 순수 WebSocket              | 단순, JSON 메시지 직접 처리                                                | topic 라우팅·heartbeat 직접 구현 |
| Server-Sent Events          | HTTP 기반 단방향 (서버 → 클라)                                             | 단방향이라 양방향 필요 시 부적합 |

→ **STOMP 추천** (Spring 통합성 + 양방향 + topic 패턴).

### 3-2. Endpoint / Topic 구조 (제안)

```
ws://host/api/ws            # 핸드셰이크 endpoint (STOMP)
/topic/orders               # 모든 주문 이벤트 broadcast
/topic/orders/store/{seq}   # 특정 매장 주문만 (필요 시 세분화)
/user/queue/notifications   # 사용자별 알림 (1:1)
```

기본은 `/topic/orders` 단일 토픽으로 시작. 매장별 분리는 트래픽 증가 시.

### 3-3. 메시지 envelope (제안)

```json
{
  "type": "order:status-changed",
  "timestamp": "2026-04-26T10:23:45Z",
  "payload": {
    "seq": 101,
    "status": "COOKED",
    "cookedAt": "...",
    "modAt": "..."
  },
  "originUserId": "user-123"
}
```

- `originUserId` — 본인 액션 식별용 (자체 mutation으로 이미 캐시 갱신했다면 중복 처리 회피)
  - 또는 단순히 모두 처리 (idempotent — `setQueryData` 멱등)

### 3-4. 인증

- 핸드셰이크 시 JWT 전달 (header / query param)
- 백엔드에서 SecurityContext에 따라 토픽 권한 결정

---

## 4. Frontend 구현 방향

### 4-1. 의존성

```bash
npm i @stomp/stompjs sockjs-client
# 또는 순수 WS면 native WebSocket
```

### 4-2. WS 클라이언트 위치

```
src/
├── ws/
│   ├── wsClient.ts           # STOMP client singleton, connect/disconnect/subscribe
│   └── orderEventHandler.ts  # 주문 이벤트 → TanStack cache 업데이트
└── composables/
    └── useWebSocket.ts       # App.vue/Layout에서 1회 호출 (lifecycle)
```

별도 디렉토리 `src/ws/` 신설. 도메인별 핸들러 분리.

### 4-3. 구현 패턴 (제안)

```ts
// src/ws/wsClient.ts
import { Client } from "@stomp/stompjs";

export const wsClient = new Client({
  brokerURL: "/ws", // proxy 통과
  connectHeaders: { Authorization: `Bearer ${token}` },
  reconnectDelay: 5000,
});
```

```ts
// src/ws/orderEventHandler.ts
import { useQueryClient } from "@tanstack/vue-query";
import { QUERY_KEYS } from "@/queries/queryKeys";
import type { OrderExt, OrderStatusChangeResult } from "@/types/order";

export function registerOrderEventHandlers(queryClient: QueryClient) {
  wsClient.subscribe("/topic/orders", (msg) => {
    const event = JSON.parse(msg.body) as OrderEvent;
    switch (event.type) {
      case "order:created":
      case "order:updated":
        queryClient.setQueryData<OrderExt[]>(QUERY_KEYS.ordersMonitor, (old) =>
          upsertOrder(old, event.payload),
        );
        break;
      case "order:status-changed":
        queryClient.setQueryData<OrderExt[]>(QUERY_KEYS.ordersMonitor, (old) =>
          patchOrderStatus(old, event.payload),
        );
        break;
      case "order:removed":
        queryClient.setQueryData<OrderExt[]>(QUERY_KEYS.ordersMonitor, (old) =>
          old?.filter((o) => o.seq !== event.payload.seq),
        );
        break;
    }
  });
}
```

```ts
// src/composables/useWebSocket.ts
export function useWebSocket() {
  const queryClient = useQueryClient();
  onMounted(() => {
    wsClient.activate();
    wsClient.onConnect = () => registerOrderEventHandlers(queryClient);
  });
  onBeforeUnmount(() => wsClient.deactivate());
}
```

```vue
<!-- App.vue -->
<script setup>
import { useWebSocket } from "@/composables/useWebSocket";
useWebSocket();
</script>
```

### 4-4. 캐시 업데이트 전략 — `setQueryData` 우선

| 전략                  | 사용 시점                                                       |
| --------------------- | --------------------------------------------------------------- |
| **`setQueryData`** ⭐ | 페이로드로 직접 패치 가능할 때 (대부분) — 네트워크 호출 없음    |
| `invalidateQueries`   | 페이로드만으로는 부족 / 정렬·필터 재계산 필요 / 안전한 fallback |

`order:status-changed`의 `OrderStatusChangeResult`는 변경 필드만 받으므로 setQueryData에 최적.

---

## 5. Migration 작업 항목

### 5-1. Mutation 정리

WS 도입 시 모든 mutation에서 `invalidateQueries` 제거:

| 위치                                                      | 현재 상태                      | 작업            |
| --------------------------------------------------------- | ------------------------------ | --------------- |
| [`useOrderStatusMutation`](../src/queries/ordersQuery.ts) | invalidate 사용 중 (TODO 주석) | invalidate 제거 |
| `useOrderCreateMutation`                                  | invalidate 없음                | 변경 없음       |
| `useOrderUpdateMutation`                                  | invalidate 없음                | 변경 없음       |
| `useOrderRemoveMutation`                                  | invalidate 없음                | 변경 없음       |

→ mutation hooks는 **UX 책임만** 유지 (loading state, onSuccess 사이드 이펙트, onError 토스트).

### 5-2. 신규 파일

- `src/ws/wsClient.ts` — STOMP 클라이언트 singleton
- `src/ws/orderEventHandler.ts` — 주문 이벤트 → cache 업데이트
- `src/composables/useWebSocket.ts` — App lifecycle 통합

### 5-3. 수정 파일

- `src/App.vue` — `useWebSocket()` 1줄 추가
- `src/queries/ordersQuery.ts` — `useOrderStatusMutation` invalidate 제거 + TODO 주석 제거
- `src/main.ts` (옵션) — JWT 등 ws 초기 설정

### 5-4. 삭제 가능

- `src/data/dummy/orders.ts` — 백엔드 안정화 시점에 검토

---

## 6. Edge cases

### 6-1. 자기 자신 액션의 echo

본인이 mutation 호출 → 백엔드 처리 → WS broadcast → 본인도 수신.

- `setQueryData`는 멱등 — 같은 데이터로 patch 한 번 더 해도 무해
- 그래도 중복 처리 피하려면 envelope의 `originUserId` 체크
- **시작 단계엔 idempotent에 의존** (단순) → 이슈 시 originUserId 체크 추가

### 6-2. 연결 끊김

- WS 재연결까지 기간엔 변화 누락 가능
- **재연결 시점에 `invalidateQueries({ queryKey: ['orders'] })` 호출** → 전체 fresh fetch
- `wsClient.onConnect` 핸들러에서 매번 invalidate (첫 연결도 포함) — 안전한 fallback

### 6-3. 메시지 순서 뒤바뀜

- WS는 보통 순서 보장하지만 reconnect 등으로 깨질 수 있음
- `modAt` 타임스탬프 비교로 stale 메시지 무시 (선택적 — 시작 단계엔 무시)

### 6-4. 토픽 권한

- 매장 직원은 자기 매장만 보여야 한다면 `/topic/orders/store/{seq}` 분리 필요
- 시작 단계엔 단일 토픽 → 권한 분리는 다음 단계

### 6-5. KeepAlive와 WS

- OrdersMonitorPage가 KeepAlive deactivate된 동안에도 mounted 상태 유지 → query 구독자도 활성
- WS 메시지로 cache 갱신 → 페이지 재진입 시 즉시 최신 상태
- KeepAlive evict (영업 외 이동) 시 다음 진입 때 fresh fetch이라 영향 없음

---

## 7. 단계적 도입 순서 (제안)

1. **백엔드 STOMP 설정** + `/topic/orders` 토픽 + 4개 이벤트 publish
2. **프론트엔드 WS 클라이언트** (`src/ws/wsClient.ts`)
3. **이벤트 핸들러** (`orderEventHandler.ts`) — `setQueryData` 패턴
4. **App.vue 통합** — `useWebSocket()` 호출
5. **Migration** — `useOrderStatusMutation`의 invalidate 제거
6. **검증** — 멀티 탭 테스트 (탭1에서 액션 → 탭2 즉시 반영)
7. **재연결 fallback** — onConnect에서 `invalidateQueries`
8. **(추후) 매장별 토픽 / 권한 / originUserId echo 처리**

---

## 8. 테스트 시나리오

### 멀티 탭 테스트

1. 탭1: `/orders/monitor` 열기
2. 탭2: `/orders` 열기 → 새 주문 생성
3. 탭1: **새 카드가 진행 중 섹션에 즉시 추가됨** ✅
4. 탭1에서 완료 버튼 → 탭2(만약 monitor도 열려 있다면) 즉시 완료 섹션으로 이동 ✅
5. 탭2의 ⋮ → 삭제 → 탭1에서 카드 사라짐 ✅

### 연결 끊김 시나리오

1. WS 강제 종료 (DevTools → Network → WS → Close)
2. 다른 탭에서 주문 생성
3. 끊긴 탭은 즉시 반영 안 됨 (정상)
4. 재연결 발동 (5초 후) → onConnect → invalidate → fresh fetch → 반영 ✅

---

## 9. Open Questions

해결되어야 할 결정 사항:

1. **STOMP vs 순수 WS** — STOMP 추천이지만 백엔드 협의 필요
2. **토픽 세분화 시점** — 단일 `/topic/orders`로 시작 OK?
3. **매장별 권한** — 시작 단계엔 모든 사용자가 모든 주문 볼 수 있어야 하나?
4. **JWT 만료 시 reconnect** — 토큰 갱신 후 자동 reconnect 흐름 설계
5. **개발 환경 proxy** — vite proxy `/ws` 경로 추가 필요
6. **WebSocket vs SSE** — 양방향 통신 필요 케이스 있는가? (현재는 서버→클라 단방향만 필요해 보임)
7. **메시지 envelope 표준** — `type/timestamp/payload/originUserId` 합의

---

## 10. 참고

- 현재 mutation 정의: [src/queries/ordersQuery.ts](../src/queries/ordersQuery.ts)
- 현재 API 호출: [src/apis/ordersApi.ts](../src/apis/ordersApi.ts)
- 백엔드 컨트롤러: `cheonil-restaurant-spring/src/main/java/com/ban/cheonil/order/OrderController.java`
- TanStack Query 문서: https://tanstack.com/query/latest/docs/vue/guides/caching
- STOMP.js: https://stomp-js.github.io/stomp-websocket/
- Spring WebSocket: https://docs.spring.io/spring-framework/reference/web/websocket.html
