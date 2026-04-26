<template>
  <section class="grid-row-stretch-case flex flex-col gap-6">
    <header>
      <h2 class="text-xl font-bold text-surface-900">Grid 행 stretch — items-start로 해결</h2>
      <p class="mt-1 text-sm text-surface-500">
        Grid의 row 트랙은 자동으로 max content 크기로 정해지고, 기본
        <code class="rounded bg-surface-100 px-1">align-items: stretch</code> 때문에 같은 row의
        다른 아이템들도 그 높이까지 늘어남. 자식에 <code class="rounded bg-surface-100 px-1">h-*</code>를
        걸어도 트랙은 별개로 결정됨.
      </p>
    </header>

    <!-- 토글 -->
    <div class="flex items-center gap-4 rounded-lg border border-surface-200 bg-surface-0 p-4">
      <label class="flex items-center gap-2 text-sm font-semibold text-surface-700">
        <input v-model="applyFix" type="checkbox" class="size-4" />
        items-start 적용
      </label>
      <span class="text-sm text-surface-500">
        {{
          applyFix
            ? '✅ 각 카드가 자기 콘텐츠 크기 유지'
            : '❌ 같은 row의 카드들이 가장 큰 카드 높이로 stretch'
        }}
      </span>
    </div>

    <!-- Live demo -->
    <div class="flex flex-col gap-2">
      <span class="text-xs font-semibold text-surface-500"
        >결과 — 카드 콘텐츠 길이가 다 다름</span
      >
      <div class="rounded-lg border border-dashed border-surface-300 bg-surface-50 p-4">
        <div
          :class="[
            'grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3',
            applyFix ? 'items-start' : '',
          ]"
        >
          <div
            v-for="card in CARDS"
            :key="card.id"
            class="flex flex-col gap-2 rounded-md border border-surface-200 bg-surface-0 p-3"
          >
            <h4 class="text-sm font-bold text-surface-900">{{ card.title }}</h4>
            <p class="text-xs text-surface-600">{{ card.body }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 비교 (참고용) -->
    <details class="rounded-lg border border-surface-200 bg-surface-0">
      <summary class="cursor-pointer p-3 text-sm font-semibold text-surface-700">
        다른 해결 방법
      </summary>
      <ul class="flex flex-col gap-2 px-4 pb-4 text-sm text-surface-700">
        <li>
          <code class="rounded bg-surface-100 px-1">grid-auto-rows-[<n>px]</code> — 모든 row 높이
          강제 통일 (콘텐츠 잘릴 수 있음)
        </li>
        <li>
          <code class="rounded bg-surface-100 px-1">self-start</code> — 일부 아이템만 개별 적용
        </li>
        <li>
          <code class="rounded bg-surface-100 px-1">min-h-0</code> + 명시적 height — 콘텐츠
          무시하고 강제 (잘림)
        </li>
      </ul>
    </details>

    <!-- Code -->
    <div class="flex flex-col gap-2">
      <span class="text-xs font-semibold text-surface-500">코드</span>
      <pre
        class="overflow-auto rounded-lg border border-surface-200 bg-surface-900 p-4 text-sm leading-relaxed text-surface-50"
      ><code>{{ CODE }}</code></pre>
    </div>

    <!-- 핵심 포인트 -->
    <aside class="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h3 class="mb-2 text-sm font-bold text-amber-900">핵심 포인트</h3>
      <ul class="flex flex-col gap-1 text-sm text-amber-900">
        <li>
          기본 <code class="rounded bg-amber-100 px-1">grid-template-rows: auto</code> → row 트랙
          높이 = 그 row의 max content
        </li>
        <li>
          기본 <code class="rounded bg-amber-100 px-1">align-items: stretch</code> → 아이템이 트랙
          높이까지 늘어남
        </li>
        <li>
          자식의 <code class="rounded bg-amber-100 px-1">h-*</code>는 아이템 자체에만 적용 — row
          트랙 크기는 별개
        </li>
        <li>
          <strong>해결</strong>: grid 컨테이너에 <code class="rounded bg-amber-100 px-1">items-start</code>
          → 자식이 자기 콘텐츠 크기 유지하고 위쪽 정렬
        </li>
        <li>
          카드 그리드, 태그 리스트 등 콘텐츠 길이가 가변적인 곳에선 거의 항상 필요
        </li>
      </ul>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const applyFix = ref(true)

const CARDS = [
  { id: 1, title: '짧은 카드', body: '한 줄' },
  { id: 2, title: '중간 카드', body: '두 줄 정도 들어가는 설명 텍스트입니다.' },
  {
    id: 3,
    title: '긴 카드',
    body: '여러 줄로 늘어나는 설명. 이 카드 때문에 같은 row의 다른 카드들이 같이 늘어납니다. items-start 없이는요.',
  },
  { id: 4, title: '짧은 카드', body: '간단' },
  { id: 5, title: '중간 카드', body: '두 줄 짜리 설명 텍스트' },
  { id: 6, title: '짧은 카드', body: '끝' },
] as const

const CODE = `<!-- ❌ 기본: 같은 row 카드들이 max 높이로 stretch -->
<div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
  <div v-for="card in cards" ...>...</div>
</div>

<!-- ✅ items-start로 각 카드 자기 크기 유지 -->
<div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 items-start">
  <div v-for="card in cards" ...>...</div>
</div>`
</script>
