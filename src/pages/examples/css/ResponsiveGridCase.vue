<template>
  <section class="responsive-grid-case flex flex-col gap-6">
    <header>
      <h2 class="text-xl font-bold text-surface-900">반응형 그리드 (auto-fill + minmax)</h2>
      <p class="mt-1 text-sm text-surface-500">
        카드 최소 너비만 지정하면 컨테이너 너비에 따라 열 수가 자동 조정됨. 미디어 쿼리 불필요.
      </p>
    </header>

    <!-- 컨트롤 -->
    <div
      class="flex flex-wrap items-center gap-4 rounded-lg border border-surface-200 bg-surface-0 p-4"
    >
      <label class="flex items-center gap-2 text-sm font-semibold text-surface-700">
        카드 최소 너비
        <InputNumber
          v-model="minWidth"
          :min="80"
          :max="500"
          :step="20"
          suffix="px"
          show-buttons
          :input-style="{ width: '8.5rem' }"
        />
      </label>
      <label class="flex items-center gap-2 text-sm font-semibold text-surface-700">
        카드 개수
        <InputNumber
          v-model="itemCount"
          :min="1"
          :max="30"
          show-buttons
          :input-style="{ width: '8.5rem' }"
        />
      </label>
    </div>

    <!-- Live demo -->
    <div class="flex flex-col gap-2">
      <span class="text-xs font-semibold text-surface-500"
        >결과 — 브라우저 창 폭 조절해서 확인</span
      >
      <div class="rounded-lg border border-dashed border-surface-300 bg-surface-50 p-4">
        <div :style="{ gridTemplateColumns: cGridCols }" class="grid gap-3">
          <div
            v-for="n in itemCount"
            :key="n"
            class="flex h-20 items-center justify-center rounded-md bg-primary-100 font-semibold text-primary-900"
          >
            #{{ n }}
          </div>
        </div>
      </div>
    </div>

    <!-- Code -->
    <div class="flex flex-col gap-2">
      <span class="text-xs font-semibold text-surface-500">코드</span>
      <pre
        class="overflow-auto rounded-lg border border-surface-200 bg-surface-900 p-4 text-sm leading-relaxed text-surface-50"
      ><code>{{ cCode }}</code></pre>
    </div>

    <!-- 핵심 포인트 -->
    <aside class="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 class="mb-2 text-sm font-bold text-blue-900">핵심 포인트</h3>
      <ul class="flex flex-col gap-1 text-sm text-blue-900">
        <li>
          <code class="rounded bg-blue-100 px-1">auto-fill</code> — 빈 공간 있으면 트랙 추가 생성
        </li>
        <li>
          <code class="rounded bg-blue-100 px-1">minmax(min, 1fr)</code> — 최소 min, 최대 1fr (남은
          공간 균등 분배)
        </li>
        <li>
          <code class="rounded bg-blue-100 px-1">auto-fit</code>과 차이 — fit은 아이템 없으면 트랙
          붕괴(아이템이 늘어남)
        </li>
        <li>카드 내부 그리드에도 동일 패턴 적용 가능 (메뉴 리스트, 태그 등)</li>
      </ul>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const minWidth = ref(200)
const itemCount = ref(8)

const cGridCols = computed(() => `repeat(auto-fill, minmax(${minWidth.value}px, 1fr))`)

const cCode = computed(
  () => `<!-- style 바인딩 방식 -->
<div
  class="grid gap-3"
  :style="{ gridTemplateColumns: 'repeat(auto-fill, minmax(${minWidth.value}px, 1fr))' }"
>
  <div v-for="n in ${itemCount.value}" :key="n">#{{ n }}</div>
</div>

<!-- Tailwind arbitrary value 방식 (정적 값) -->
<div class="grid gap-3 grid-cols-[repeat(auto-fill,minmax(${minWidth.value}px,1fr))]">
  ...
</div>`,
)
</script>
