# 관리 페이지 — 리오더 및 마스터 관리 계획

> 대상 페이지: `/stores`, `/menus`, `/master`
> OrdersPage(`/orders`)는 **읽기 전용**으로 이 순서를 사용
> 관련 문서: [ORDERS_PAGE_IMPL.md](./ORDERS_PAGE_IMPL.md), [ORDER_PAGES_REVIEW.md](./ORDER_PAGES_REVIEW.md)

---

## 0. 배경

POS 흐름(주문) 과 관리 흐름(매장/메뉴 등록·재배치) 은 사용 빈도와 사용자 역할이 달라 **페이지로 분리**한다.

- `/orders` — 캐셔/서버가 매일 수백 번 사용 (읽기)
- `/stores`, `/menus`, `/master` — 사장/매니저가 가끔 사용 (쓰기·재배치)

정렬·순서 관리를 OrdersPage 에 섞으면 제스처 충돌(선택 클릭 vs 드래그) 과 UI 복잡도가 증가하므로 **관리 페이지가 순서의 소유자** 역할을 맡는다.

---

## 1. 정렬 저장 구조

### 원칙

- 정수 `sort_order` 컬럼 방식은 채택하지 않음 — **단건 이동마다 cascade UPDATE** 문제
- 카테고리 테이블의 `options` 에 배열을 두는 방식도 채택하지 않음 — **카테고리 간 이동 시 양쪽 동기화 필요**
- **전역 1곳(`m_setting.config`)에 배열로 저장** — 한 번의 UPDATE 로 전체를 덮어씀

### 스키마 (DDL 변경 없음, 관례 정립)

```jsonc
// m_setting 테이블 (이미 존재)
// seq = 1 로우의 config
{
  "storeCtgOrder": [1, 2, 3],                 // 매장 카테고리 탭 순서
  "storeOrder":    [2, 5, 1, 8, 3],           // 전체 매장 순서 (global)
  "menuCtgOrder":  [1, 4, 2, 3, 5, 6],        // 메뉴 카테고리 탭 순서
  "menuOrder":     [7, 2, 3, 1, 5, 4]         // 전체 메뉴 순서 (global)
}
```

### 핵심 아이디어

**전역 1-array 를 유지하고, 카테고리는 필터 역할만**.

- 메뉴가 카테고리 2 → 카테고리 3 으로 이동해도 `menuOrder` 배열은 **수정 불필요**
- 새 메뉴 등록 시 `menuOrder` 에 없으면 조회 뷰가 **자동으로 tail 에 배치** (CRUD 동기화 코드 불필요)
- 삭제된 seq 가 배열에 남아도 LEFT JOIN 으로 무시됨 (stale 허용)

### m_setting 컨벤션

- `seq = 1` 을 전역 system config 로 고정 사용
- 앱 기동 시 해당 로우 존재 확인 (부재 시 초기화 스크립트 또는 seed 에서 생성)

```sql
insert into m_setting (seq, config) values (1, '{}'::jsonb)
on conflict do nothing;
```

---

## 2. 조회 패턴 — 편의 뷰

매 조회마다 `jsonb_array_elements_text + ordinality` 를 쓰지 않도록 뷰로 래핑.

```sql
create or replace view v_menu_ordered as
with order_map as (
  select t.val::int as seq, t.ord
  from m_setting m,
       jsonb_array_elements_text(m.config->'menuOrder') with ordinality t(val, ord)
  where m.seq = 1
)
select m.*, coalesce(o.ord, 999999) as display_order
from m_menu m
left join order_map o using (seq);

-- 대칭으로 매장, 카테고리들도 작성
create or replace view v_store_ordered        as ...;
create or replace view v_menu_category_ordered as ...;
create or replace view v_store_category_ordered as ...;
```

### 사용 예

```sql
-- 카테고리 1 소속 메뉴를 사용자 지정 순서대로
select * from v_menu_ordered
where ctg_seq = 1
order by display_order, seq;

-- 메뉴 카테고리 탭 순서대로
select * from v_menu_category_ordered
order by display_order, seq;
```

`order by display_order, seq` 의 2차 기준 `seq` 는 같은 `display_order` 인 stale/신규 항목 간 안정 정렬 보장용.

---

## 3. 리오더 API

### 엔드포인트

```
PATCH /api/settings/order
```

### 요청

```ts
type OrderPatch = {
  storeCtgOrder?: number[]
  storeOrder?:    number[]
  menuCtgOrder?:  number[]
  menuOrder?:     number[]
}
```

- 한 번의 요청으로 여러 키 동시 수정 가능
- 키별 부분 업데이트 지원 (전달하지 않은 키는 기존 값 유지)

### 서버 구현

```sql
update m_setting
set config = config || $1::jsonb
where seq = 1;
```

`jsonb` 의 `||` (concatenate) 연산자는 **key 단위 merge** — 전달한 key만 덮어쓰고 나머지 key 는 유지. 단일 트랜잭션·단일 UPDATE 로 원자적 수정.

### 검증 (서비스 레이어)

- 배열 원소가 정수인지
- 중복 seq 없는지
- 실제 존재하는 seq 인지 (소프트 검증, stale 허용 정책과 충돌 않는 선)

---

## 4. Stale seq 정책

삭제된 seq 가 config 배열에 남는 현상.

- **기본 정책: 무시** — 조회 뷰가 LEFT JOIN 으로 스킵하므로 동작 문제 없음
- 누적이 신경 쓰이면 관리 페이지에 **"순서 정리" 버튼** 제공 (아래 DB 쿼리 실행)

```sql
-- 삭제된 seq 를 menuOrder 에서 제거
update m_setting
set config = jsonb_set(
  config,
  '{menuOrder}',
  (
    select coalesce(jsonb_agg(v.val::int), '[]'::jsonb)
    from jsonb_array_elements_text(config->'menuOrder') v(val)
    where exists (select 1 from m_menu where seq = v.val::int)
  )
)
where seq = 1;
```

대칭으로 store/category 들도 동일 패턴.

---

## 5. 관리 페이지별 책임 분배

### `/stores` — StoresPage
- 매장 CRUD
- 매장 드래그 리오더 → `storeOrder` 업데이트
- 매장 카테고리 소속 변경 (드롭다운)

### `/menus` — MenusPage
- 메뉴 CRUD
- 메뉴 드래그 리오더 → `menuOrder` 업데이트
- 메뉴 카테고리 소속 변경

### `/master` — MasterPage
- 매장 카테고리 CRUD + 탭 순서 → `storeCtgOrder`
- 메뉴 카테고리 CRUD + 탭 순서 → `menuCtgOrder`
- 기타 마스터 (단위, 지출 카테고리 등 확장 여지)

---

## 6. 프런트 구현 가이드

### 드래그 라이브러리
- [`vuedraggable@next`](https://github.com/SortableJS/vue.draggable.next) 권장 (Vue 3, Sortable.js 기반)
- 접근성 키보드 이동 지원 필요 시 검토

### UI 패턴
- 페이지 상단: 리스트 + 드래그 핸들
- 리스트 하단 또는 상단 고정: **"순서 저장"** 버튼 (dirty 상태 표시)
- 각 드래그 이동마다 저장 아님 — **일괄 저장** (last-write-wins 리스크 감수)

### 낙관적 업데이트
- 클라이언트: 즉시 배열 rearrange + 서버 요청
- 실패 시 rollback + Toast 에러

---

## 7. 동시성

- POS 규모에서 두 관리자가 동시에 같은 순서를 수정하는 시나리오는 드묾
- 기본: **last-writer-wins**
- 문제가 되면 다음 단계로 낙관적 잠금 추가:
  - `m_setting.mod_at` 컬럼 추가 후 PATCH 요청에 `if_match: <mod_at>` 헤더
  - 서버가 mismatch 시 409 Conflict 반환 → 클라이언트 재조회 유도

현재는 **구현하지 않음**.

---

## 8. 구현 순서 (제안)

1. `m_setting seq=1` 로우 존재 보장 (seed/초기화)
2. 뷰 4개 생성 (`v_menu_ordered`, `v_store_ordered`, `v_menu_category_ordered`, `v_store_category_ordered`)
3. `/api/settings/order` PATCH 엔드포인트
4. `MenusPage` — 드래그 리오더 + 저장 (가장 단순, 검증용)
5. `StoresPage` — 동일 패턴 적용
6. `MasterPage` — 카테고리 탭 리오더
7. OrdersPage 가 view 에서 조회하도록 `menusApi`/`storesApi` 조정

---

## 9. 결정 기록

| 항목 | 결정 | 대안 | 사유 |
|---|---|---|---|
| 저장 위치 | `m_setting.config` 전역 | 카테고리 options 배열 / 각 테이블 sort_order 컬럼 | 단일 UPDATE, 교차 동기화 불필요, 테이블 주석 용도와 일치 |
| 카테고리 정렬 | 필터만, 순서는 전역 배열 | 카테고리별 배열 | 메뉴 카테고리 이동 시 재동기화 불필요 |
| stale seq | 무시 (LEFT JOIN) | 트리거로 자동 청소 | 복잡도 낮음, 성능 영향 없음 |
| 저장 UX | 일괄 저장 버튼 | 매 이동마다 자동 저장 | 드래그 중간 상태 네트워크 비용 절감, 취소 용이 |
| 동시성 | last-writer-wins | 낙관적 잠금 | POS 규모에서 발생 빈도 낮음 |
| 스키마 변경 | 없음 | sort_order 컬럼 추가 | DDL migration 없이 시작 가능 |
