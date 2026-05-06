# 메뉴 관리 페이지 구현 방안

> 메뉴 CRUD + 활성 토글 + 복제. 피그마 [메뉴관리 / 메뉴추가] 디자인 기반.
> 영업 페이지의 그리드(`MenuGrid`)는 **표시·정렬** 만, 관리 페이지는 **정보 CRUD** 분리.

---

## 1. 핵심 원칙

1. **테이블 형식** — 피그마 디자인 그대로. 그리드 형식은 영업 페이지에서만.
2. **수정/추가 통합 페이지** — `OrderRsvsEditPage` 패턴 미러링 (라우트 1개, store 의 `editingSeq` 로 모드 분기)
3. **노출 토글** = `active` 컬럼. 영업 페이지에는 활성만 노출 (이미 적용).
4. **복제** = 동일 카테고리·가격·옵션으로 새 메뉴 row 생성 (이름은 `"원본명 (복사)"` 형태)
5. **검색 / 카테고리 필터** — 영업 페이지의 `MenuGrid` 패턴 재사용 (자모/초성 검색)

---

## 2. 페이지 / 라우트 구성

| 그룹 | 파일 | 라우트 | 비고 |
|------|------|--------|------|
| 관리 | `MenusPage.vue` | `/menus` | 테이블 + 카테고리 탭 + 검색 ✅ 라우트 존재 |
| 관리 | `MenusEditPage.vue` | `/menus/edit` | 추가/수정 통합 폼 🆕 |

라우트 추가는 [src/router/routes.ts](../../src/router/routes.ts) 보강. 사이드바에는 `/menus` 만 노출.

생성/수정 모드 분기는 `menuFormStore.editingSeq` 로 ([orderRsvCartStore 패턴](../done/RESERVATION_PLAN_결정.md) 미러링).

---

## 3. 데이터 레이어

### 3-1. 현재 상태 (백엔드)
- ✅ `GET /menus?includeInactive=` — 목록
- ✅ `GET /menus/{seq}` — 단건
- ✅ `PATCH /menus/{seq}/active` — 활성 토글
- ❌ `POST /menus` — 생성
- ❌ `PUT /menus/{seq}` — 수정
- ❌ `DELETE /menus/{seq}` — 삭제
- ❌ `POST /menus/{seq}/duplicate` — 복제

### 3-2. 백엔드 추가 필요 (4개 endpoint)

| 메서드 | 경로 | body | 응답 |
|--------|------|------|------|
| POST | `/menus` | `MenuCreateReq` | `MenuRes` |
| PUT | `/menus/{seq}` | `MenuCreateReq` (PUT 전체 교체) | `MenuRes` |
| DELETE | `/menus/{seq}` | — | 204 |
| POST | `/menus/{seq}/duplicate` | — | `MenuRes` (신규 생성된 row) |

**`MenuCreateReq` 시그니처** (백엔드 협의):
```java
public record MenuCreateReq(
    Short ctgSeq,
    String nm,
    String nmS,        // 메뉴명 축약 (4자 제한)
    Integer price,
    String cmt,
    Boolean active     // default true
) {}
```

### 3-3. 프론트 API (`apis/menusApi.ts`) 보강

```ts
export interface MenuCreatePayload {
  ctgSeq: number
  nm: string
  nmS: string
  price: number
  cmt?: string
  active?: boolean   // default true
}
export type MenuUpdatePayload = MenuCreatePayload

export async function create(payload: MenuCreatePayload): Promise<Menu> { ... }
export async function update(seq: number, payload: MenuUpdatePayload): Promise<Menu> { ... }
export async function remove(seq: number): Promise<void> { ... }
export async function duplicate(seq: number): Promise<Menu> { ... }
```

### 3-4. Query (`queries/menusQuery.ts`) 보강

기존: `useMenusQuery(includeInactive?)` / `useMenuActiveMutation`

추가:
- `useMenuQuery(seq)` — 단건 조회 (편집 페이지 hydrate 보조)
- `useMenuCreateMutation`
- `useMenuUpdateMutation`
- `useMenuRemoveMutation`
- `useMenuDuplicateMutation`

모두 `onSuccess` 에서 `invalidateQueries(QUERY_KEYS.menus)`.

---

## 4. Store ([src/stores/menuFormStore.ts](../../src/stores/menuFormStore.ts) 신규)

`orderRsvCartStore` 패턴 — 모드 분기 truth source.

```ts
export const useMenuFormStore = defineStore('menuForm', () => {
  const ctgSeq = ref<number | null>(null)
  const nm = ref('')
  const nmS = ref('')
  const price = ref<number>(0)
  const cmt = ref('')
  const active = ref(true)
  const editingSeq = ref<number | null>(null)

  const isEditing = computed(() => editingSeq.value != null)

  function loadFromMenu(m: Menu) {
    ctgSeq.value = m.ctgSeq
    nm.value = m.nm
    nmS.value = m.nmS ?? ''
    price.value = m.price
    cmt.value = m.cmt ?? ''
    active.value = m.active
    editingSeq.value = m.seq
  }

  function reset() { /* 모든 필드 초기화 */ }

  return { ctgSeq, nm, nmS, price, cmt, active, editingSeq, isEditing, loadFromMenu, reset }
})
```

---

## 5. 화면별 상세

### 5-1. `MenusPage.vue` — 메뉴 관리 (테이블)

피그마 [메뉴관리]

```
헤더:  메뉴 관리                                                                  [+ 메뉴 추가]
필터:  [전체|식사|찌개|탕|구이|면|음료]                                  [🔍 메뉴 검색]
테이블: 메뉴명 / 카테고리 / 가격 / 노출(토글) / 등록일 / 최근 수정 / 작업 [수정][복제][삭제]
```

#### 구성 요소
- **헤더**: `메뉴 관리` 제목 + [+ 메뉴 추가] 버튼
- **카테고리 탭**: `BTabs variant="outline"` 또는 그대로. 카테고리 + "전체"
- **검색 input**: 자모/초성 검색 (`useSearchFilter` 재사용)
- **테이블**: PrimeVue `DataTable` (OrderRsvTmplTable 패턴)
  - 컬럼: 메뉴명 / 카테고리 / 가격 (`{{ price.toLocaleString() }}원`) / 활성 (ToggleSwitch) / 등록일 / 최근수정 / 작업 (수정·복제·삭제 버튼)
  - sort/page 기본
  - `striped-rows`, `data-key="seq"`

#### 필터 / 검색 데이터 흐름
```ts
const { data: menus } = useMenusQuery(true)  // 비활성도 포함 (관리 페이지)
const { data: ctgs } = useMenuCtgsQuery()

const selCtg = ref(ALL_CTG_SEQ)
const searchKeyword = ref('')

const cByCategory = computed(() =>
  selCtg.value === ALL_CTG_SEQ ? menus.value ?? [] : menus.value?.filter((m) => m.ctgSeq === selCtg.value) ?? [],
)
const { cFiltered: cFilteredMenus } = useSearchFilter(cByCategory, searchKeyword, (m) => m.nm)
```

#### 핸들러
- `onAdd` → `menuFormStore.reset()` + `router.push('/menus/edit')`
- `onEdit(seq)` → `loadFromMenu` + push
- `onDuplicate(seq)` → `useMenuDuplicateMutation` mutate
- `onRemove(seq)` → confirm → `useMenuRemoveMutation` mutate
- `onToggleActive(seq, active)` → `useMenuActiveMutation` mutate

### 5-2. `MenusEditPage.vue` — 메뉴 추가/수정 통합

피그마 [메뉴추가]

```
헤더:  [←] 메뉴 추가/수정       관리 › 메뉴 관리 목록 › 메뉴 추가
폼:    [기본 정보]
         카테고리 *  Select
         메뉴명 *    InputText
         메뉴명 축약 * InputText (max 4자, 안내 텍스트)
       [가격]       (1000원 단위 권장)
         가격 *      InputNumber (₩ 7000)
       [부가 정보]   (선택)
         비고        Textarea
CTA:                                                              [취소] [저장]
```

#### 컴포넌트 구성
- **헤더**: OrderRsvsEditPage 패턴 (뒤로가기 + 제목 + breadcrumb "관리 › 메뉴 관리 목록 › 메뉴 추가/수정")
- **폼 본문**: 별도 컴포넌트로 분리 안 하고 페이지 내 인라인 — 폼이 단순
  - PrimeVue `Select`, `InputText`, `InputNumber`, `Textarea`
  - 메뉴명 축약 maxlength=4 + 안내 (`주방 화면 / 면수표 등 좁은 곳에 표시 (최대 4자)`)
  - 가격: `:min="0"` `:step="1000"` (1000원 단위 가이드 — strict 강제 X)
- **CTA**: 우하단 [취소] [저장]
- 저장 가능 조건: `ctgSeq != null && nm.trim() && nmS.trim() && price > 0`

#### 핸들러
```ts
function onSave() {
  if (!cCanSave.value) return
  const payload: MenuCreatePayload = {
    ctgSeq: ctgSeq.value!, nm: nm.value.trim(), nmS: nmS.value.trim(),
    price: price.value, cmt: cmt.value || undefined, active: active.value,
  }
  if (isEditing.value && editingSeq.value != null) {
    updateMenu({ seq: editingSeq.value, payload }, { onSuccess: () => { reset(); push('/menus'); toast() } })
  } else {
    createMenu(payload, { onSuccess: ... })
  }
}
function onCancel() { reset(); push('/menus') }
```

---

## 6. 컴포넌트 구성

### 6-1. 신규
| 위치 | 컴포넌트 | 역할 |
|------|---------|------|
| `components/menus/` | `MenuTable.vue` | DataTable wrap. 컬럼 정의 + emit (edit/duplicate/remove/toggle-active) |
| `pages/` | `MenusEditPage.vue` | 추가/수정 통합 폼 |
| `stores/` | `menuFormStore.ts` | 폼 draft + editingSeq |

### 6-2. 재사용
- `BButton`, `BTabs`, `BInfoBanner`
- `useSearchFilter` (자모/초성 검색)
- `useMenuCtgsQuery` (카테고리)

---

## 7. 구현 순서

| 단계 | 범위 | 종속성 |
|------|------|-------|
| **1. 백엔드 endpoint** | POST/PUT/DELETE/POST duplicate 4개 | — |
| **2. API/Query 보강** | `MenuCreatePayload` + `create/update/remove/duplicate` + 4개 mutation hook | 1 |
| **3. menuFormStore** | 폼 draft store | — (병렬 가능) |
| **4. MenusPage (테이블)** | 헤더 + 필터/검색 + DataTable + 토글/복제/삭제 mutation 연결 | 2 |
| **5. MenusEditPage (폼)** | 추가/수정 통합 페이지 + 라우트 + onAdd/onEdit 연결 | 2, 3 |

각 단계별로 type-check 통과 보장.

---

## 8. 디자인 편차 / 결정 필요

| 항목 | 피그마 | 결정 |
|------|--------|------|
| 카테고리 탭 variant | 큰 segmented (전체 강조) | `BTabs variant="outline"` (작은 강조) — 영업 페이지와 일관 |
| 가격 입력 | 일반 input | PrimeVue `InputNumber` (₩ prefix + 천단위 콤마) |
| 메뉴명 축약 4자 제한 | 안내 텍스트 + maxlength | maxlength="4" 강제 |
| 복제 동작 | 즉시 row 추가 | 토스트 "복제됨" + 새 row 가 테이블에 자동 추가 (invalidate 후 재조회 — 새 행 강조 X) |
| 등록일/최근수정 컬럼 | 표시 (피그마) | `format(d, 'yyyy.MM.dd')` |
| 작업 컬럼 너비 | 고정 | `style="width: 200px"` |

---

## 9. 매장 관리 페이지 (`StoresPage`) — 후속

피그마 [매장관리 / 매장추가] 도 거의 동일한 패턴. 메뉴 관리 완성 후 동일 구조로 작성:
- `StoresPage.vue` (테이블) + `StoresEditPage.vue` (폼) + `storeFormStore.ts`
- 폼 필드: `ctgSeq`, `nm`, `addr` (구역), `cmt`, `active`
- 컴포넌트 구조 메뉴 관리 그대로 복제

→ 메뉴 관리 PR merge 후 매장 관리 동일 패턴으로 일괄 작성.

---

## 10. 협업 규약 준수

- 코딩 가이드라인: import 그룹 / `c` prefix computed / `B*` 컴포넌트 ✅
- 디자인 편차 허용 (§8 표) ✅
- prime-vue 가이드: 새 PrimeVue 컴포넌트 (InputNumber, ToggleSwitch) 첫 사용 시 [docs/instruct/prime-vue.md](../instruct/prime-vue.md) 참고 ✅
