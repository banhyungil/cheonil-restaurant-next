# PrimeVue

## 래퍼 (B\* 컴포넌트) 작성 워크플로우

PrimeVue 컴포넌트 기반 래퍼 (BButton, BTabs 등) 를 새로 만들거나 스타일 커스텀할 때 **반드시 아래 순서로** 진행한다.
추측 기반으로 `!important` 를 남발하거나 layer 를 건드리기 전에 **실제 내부 구조를 먼저 확인**할 것.

### 1. PrimeVue 컴포넌트 내부 요소 구조 확인

- node_modules/primevue/<component>/index.mjs

```bash
cat node_modules/primevue/togglebutton/index.mjs
```

### 2. pt section 이름 파악

타입 파일에서 확인: <이름>PassThroughOptions 인터페이스 관련 검색

```bash
grep -nA30 'interface.*PassThroughOptions' node_modules/primevue/togglebutton/index.d.ts
```
