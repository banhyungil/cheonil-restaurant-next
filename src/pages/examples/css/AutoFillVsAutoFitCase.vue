<template>
  <section class="auto-fill-vs-auto-fit-case flex flex-col gap-6">
    <header>
      <h2 class="text-xl font-bold text-surface-900">auto-fill vs auto-fit</h2>
      <p class="mt-1 text-sm text-surface-500">
        둘 다 <code class="rounded bg-surface-100 px-1">minmax(min, 1fr)</code>과 같이 쓰지만,
        <strong>빈 공간 처리 방식</strong>이 다름. 차이는 아이템이 트랙 수보다 적을 때만 보임.
      </p>
    </header>

    <!-- 컨트롤 -->
    <div
      class="flex flex-wrap items-center gap-4 rounded-lg border border-surface-200 bg-surface-0 p-4"
    >
      <label class="flex items-center gap-2 text-sm font-semibold text-surface-700">
        카드 개수
        <InputNumber
          v-model="itemCount"
          :min="1"
          :max="10"
          show-buttons
          :input-style="{ width: '8.5rem' }"
        />
      </label>
      <span class="text-sm text-surface-500">→ 1~3개로 줄여보면 차이가 명확함</span>
    </div>

    <!-- Side-by-side demo -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- auto-fill -->
      <div class="flex flex-col gap-2">
        <div class="flex items-baseline gap-2">
          <span class="text-sm font-bold text-surface-900">auto-fill</span>
          <span class="text-xs text-surface-500">빈 트랙 유지</span>
        </div>
        <div class="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-3">
          <div class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
            <div
              v-for="n in itemCount"
              :key="n"
              class="flex h-16 items-center justify-center rounded-md bg-blue-200 font-semibold text-blue-900"
            >
              #{{ n }}
            </div>
          </div>
        </div>
      </div>

      <!-- auto-fit -->
      <div class="flex flex-col gap-2">
        <div class="flex items-baseline gap-2">
          <span class="text-sm font-bold text-surface-900">auto-fit</span>
          <span class="text-xs text-surface-500">빈 트랙 collapse → 아이템 늘어남</span>
        </div>
        <div class="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3">
          <div class="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
            <div
              v-for="n in itemCount"
              :key="n"
              class="flex h-16 items-center justify-center rounded-md bg-amber-200 font-semibold text-amber-900"
            >
              #{{ n }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Code -->
    <div class="flex flex-col gap-2">
      <span class="text-xs font-semibold text-surface-500">코드</span>
      <pre
        class="overflow-auto rounded-lg border border-surface-200 bg-surface-900 p-4 text-sm leading-relaxed text-surface-50"
      ><code>{{ CODE }}</code></pre>
    </div>

    <!-- 핵심 포인트 -->
    <aside class="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 class="mb-2 text-sm font-bold text-blue-900">핵심 포인트</h3>
      <ul class="flex flex-col gap-1 text-sm text-blue-900">
        <li>
          <strong>auto-fill</strong> — 컨테이너 폭에 들어갈 수 있는 만큼 트랙 생성, 아이템 없으면
          빈 슬롯
        </li>
        <li>
          <strong>auto-fit</strong> — auto-fill과 동일하게 트랙 만들지만, 빈 트랙은 0폭으로 접힘 →
          남은 아이템들이 늘어나서 채움
        </li>
        <li>
          <strong>아이템 ≥ 트랙 수</strong>일 땐 둘 다 동작 동일 — 차이가 안 보임
        </li>
        <li>
          기본은 <strong>auto-fill</strong> 추천 (카드 폭 일관성). 적은 아이템을 강제로 풀폭으로
          채우고 싶을 때만 auto-fit
        </li>
      </ul>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const itemCount = ref(2)

const CODE = `<!-- auto-fill: 빈 트랙 유지 -->
<div class="grid gap-2 grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
  <div v-for="n in itemCount" :key="n">#{{ n }}</div>
</div>

<!-- auto-fit: 빈 트랙 collapse → 아이템 늘어남 -->
<div class="grid gap-2 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
  <div v-for="n in itemCount" :key="n">#{{ n }}</div>
</div>`
</script>
