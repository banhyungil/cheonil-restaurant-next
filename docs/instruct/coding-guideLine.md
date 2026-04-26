# Coding Guidline

## Import

- store, composable, 기타, package 순으로 작성.
  - 알파벳 순으로 정렬
- 각 그룹별로 공백 한 칸 씩

## store, composable 사용

- script 최 상단에서 선언 후 사용
  - store - composable 순으로 작성

- store
  - side effect logic을 포함시키지 않는다. store는 중앙 상태관리를 위한 용도이므로 다양한 곳에서 호출 될 수 있기 때문
    - side effect logic이 있다면 동일한 life cycle을 가지는 곳에서 동시 사용 시 side effect 중첩이 생길 수 있다.

- composable
  - side effect logic이 있을 수 있음. 대신 unMounted hook에서 해제 하는 과정을 꼭 포함시킬것. 메모리 누수를 방지하기 위함.
  - watch는 unMounted hook에서 자동으로 해제됨. 그러나 Event는 해제가 안되므로 unMounted에서 꼭 해제. (vueuse-useEventListener 사용)
  - setup root scope에서 선언해야 된다. 그렇지 않으면 component lifecycle hook을 주입받을 수 없음(onMounted, unMounted 등과 같은 hook 사용 불가능)
  - setup root scope에서 사용하더라도. watch immediate가 발동하면 setup process가 종료된다. watch immediate가 선언된 composable은 사용시 제일 마지막에 사용하도록 한다.

## api 사용

- api 함수 사용시에는 api 파일명을 namespace로 사용한다
  - 이때 전체 import 및 alias를 사용해서 namespace를 사용한다.

## Structure Naming Convention

### api

- <resource 복수형>Api
  - ex. filesApi.ts
- api 함수 호출은 namespace import를 기본으로 한다.
- namespace import를 사용하는 경우 함수명에는 resource명을 중복해서 넣지 않는다.
  - 권장: `filesApi.getList()`, `filesApi.getById()`, `
filesApi.create()`
  - 비권장: `filesApi.getFileList()`, `filesApi.getFileById()`, `filesApi.createFile()`

```typescript
import * as filesApi from 'src/apis/filesApi';

filesApi.fetchList()

// filesApi.ts
export function fetchList() {...}
export function fetchById() {...}
export function create() {...}
export function update() {...}
export function remove() {...}
```

### API / Query / Composable 레이어 구분

서로 책임이 다른 3개 레이어를 혼동하지 않도록 역할/네이밍 규칙을 분리한다.

| 레이어          | 책임                                             | 파일 네이밍         | 네이밍 방식       |
| --------------- | ------------------------------------------------ | ------------------- | ----------------- |
| `apis/`         | HTTP 호출 — 서버와의 데이터 송수신               | `<resource>Api.ts`  | resource-oriented |
| `queries/`      | TanStack Query 훅, 캐싱·변형·조합·mutation 관리  | `<resource>Query.ts` | resource-oriented |
| `composables/`  | UI/DOM 관련 재사용 훅 (포커스, 이벤트 리스너 등) | `use<기능>.ts`      | hook-oriented     |

**핵심 구분**

- `apis/` = "서버와 말함" (fetch, axios 호출)
- `queries/` = "앱 안에서 서버 데이터 관리" (invalidate, select, mutation 부수효과)
- `composables/` = "UI 동작 추상화" (서버 무관)

**네이밍 컨벤션**

- `apis/` / `queries/` — **resource-oriented**. 한 파일에 여러 훅/함수 공존 가능.
  - `menusQuery.ts` 안에 `useMenusQuery`, `useMenuUpdateMutation` 등 같이 둠.
- `composables/` — **hook-oriented**. 1 파일 1 훅 원칙.
  - `useAutoFocus.ts`, `useSearchFilter.ts` 처럼 파일명 = 훅 이름.

**예시**

```typescript
// src/apis/menusApi.ts  — HTTP 호출만
export async function fetchList(): Promise<Menu[]> { /* axios */ }

// src/queries/menusQuery.ts  — useQuery 래핑 + 부가 로직
export function useMenusQuery() {
  return useQuery({ queryKey: QUERY_KEYS.menus, queryFn: () => menusApi.fetchList() })
}
export function useMenuUpdateMutation() {
  return useMutation({ mutationFn: ..., onSuccess: () => invalidate() })
}

// src/composables/useAutoFocus.ts  — UI 훅
export function useAutoFocus(elRef, activeRef) { /* watch + focus */ }
```

### Components

1. Layout

- `Layout` postfix 사용
- <이름>Layout.vue

2. Page

- `Page` postfix 사용
- <이름>Page.vue

3. 공통 컴포넌트

- basic-components 폴더 하위
- `B` prefix 사용
- B<이름>.vue

4. 공통사항

- 각 컴포넌트 루트 요소에는 파일명 기반 kebab-case로 class를 부여한다
  - ex. `AppSidebar.vue -> class="app-sidebar"`
  - 이유. selector가 명확해져 접근이 손쉬워 짐
    - playwright나 vue에서 deep을 통한 접근 등

## Naming

### Event

- 'on' prefix를 사용
- 1. 기본 event에 따라 naming
- 기본 event는 "(기본 event 명)(name)"을 사용한다.
  - 예) onClickMarker, onClickPmarker
- 2. 기능에 따라 naming
  - 예) onCreate, onRemove

### emit

- 기능명을 사용하여 emit한다.
- 보통 이벤트에 따라 emit하는 경우가 많다. 이벤트명에서 'on' prefix를 제거 한 naming을 따른다.
- 예) onDelete -> emit('delete'), onRemove -> emit('remove')

### Store

- postfix : 'Store'
  - <이름>Store
  - 예) const heatMapStore = useHeatMapStore()
- setter 설정
  - 단일 값인 경우는 setter 함수를 생성해준다. 값 변경 추적시 용이하다.
  - 참조값인 경우는 별도 setter없이 참조 값을 직접 바꾸는 것을 허용한다.
    - setter로 하는 경우는 삭제, 추가 등 많은 경우에 대비하여 생성해줘야 하기 떄문이다.
- 제약사항
  - store내에서는 composeble 함수를 사용하지 않는것으로 한다
    - composable에 watch나 provide, inject등 component와 관련된 함수가 있을 가능성이 높기 떄문이다.

### Boolean

- `is`, `has`, `show`, `use` prefix 사용
- 예) isFullResolution, hasChanges, showDialog, useThumbnail

### Computed

- prefix : 'c'
  - c<이름>
  - 예) const cIsUlEdit = computed(() => userLayerEdit.value != null);

### key-Row Object

- DB에서 조회한 Rows는 Array 형태를 띈다.
- Rows 조작은 빈번 하기 때문에 대부분 Row Key를 이용하여 Object 형식으로 변환하여 조작한다.
- 1. object 이용
- 이때 key-row Object Naming은 prefix 'd'를 사용한다.
  - key-row 구조로 변환 시 Lodash에 'keyBy' 함수를 사용하면 편리하다.
  - 예)
    "`"
const places = [{placeId:1, placeName:'place1'}, {placeId:2, placeName:'place2'}]
const dPlace = _.keyBy(places, 'placeId');_
"`"
- 2. Map 객체 이용
- key 값에 대해 삭제도 수행할시에는 Map 객체를 이용하는 것이 좋다.
- has, delete와 같이 api가 잘 구현되어 있고, typescript와 호환성도 좋다.
- prefix는 'm'을 사용한다
- 예)
- "```"
- const mPlace = ...
- "```"

### 변수

- selected -> sel

### 약어 테이블

| 약어  | 원형          |
| ----- | ------------- |
| Mgr   | Manager       |
| Sel   | Selected      |
| Nm    | Name          |
| Prc   | Processing    |
| Osd   | OpenSeadragon |
| Btn   | Button        |
| Img   | Image         |
| Param | Parameter     |
| Props | Properties    |
| Ref   | Reference     |
| Res   | Response      |
| Req   | Request       |
| Ctg   | Category      |
| Cmt   | Comment       |
| Tmpl  | Template      |
| Rsv   | Reservation   |

## css

- sass를 이용
- nested 문법 사용

## quaser

### 로딩표시

- 비동기 로직 시 오래 걸리는 작업은 q-innter_loading 컴포넌트를 사용한다

## TSDoc

- 함수 작성시에는 tsdoc을 반드시 작성해준다.
- parameter는 상태 처리가 복잡한 경우만 명시해준다.

## Composable 사용

- Composable 함수가 많지 않은 경우는 state, 함수 모두 destructuring 해서 사용 (유연하게)
- Composable 내에 함수를 많이 사용해야 경우 객체 그대로 사용
  - 객체 변수명은 use를 제외하여 네이밍 한다. (ex.useFilterGraph.ts -> const filterGraph)
  - state는 destructuring 하여 사용 (필수)
