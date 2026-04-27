<template>
  <section class="flex-column-fill-case flex flex-col gap-6">
    <header>
      <h2 class="text-xl font-bold text-surface-900">Flex 높이 채우기 (flex-1 + min-h-0 체인)</h2>
      <p class="mt-1 text-sm text-surface-500">
        부모 flex column에서 한 자식이 남은 세로 공간을 모두 차지하게 하려면, 부모 체인 전체가 flex
        column이고 중간 레이어마다 <code class="rounded bg-surface-100 px-1">min-h-0</code>이
        필요함.
      </p>
    </header>

    <!-- 토글 -->
    <div
      class="flex items-center gap-4 rounded-lg border border-surface-200 bg-surface-0 p-4"
    >
      <label class="flex items-center gap-2 text-sm font-semibold text-surface-700">
        <input v-model="applyFix" type="checkbox" class="size-4" />
        min-h-0 + flex-1 적용
      </label>
      <span class="text-sm text-surface-500">
        {{
          applyFix
            ? '✅ 진행 중 섹션이 남은 높이를 차지'
            : '❌ 각 섹션이 content 크기로 고정 (빈 공간 발생)'
        }}
      </span>
    </div>

    <!-- Live demo (주문현황 축소판) -->
    <div class="flex flex-col gap-2">
      <span class="text-xs font-semibold text-surface-500">결과 — 컨테이너 높이 400px 고정</span>
      <div
        class="flex h-[400px] flex-col gap-4 rounded-lg border border-dashed border-surface-300 bg-surface-50 p-4"
      >
        <!-- Header (natural) -->
        <div
          class="flex h-10 shrink-0 items-center rounded-md bg-surface-200 px-3 text-sm font-semibold text-surface-700"
        >
          Header (자연 높이)
        </div>

        <!-- 중간 래퍼 -->
        <div
          :class="[
            'flex flex-col gap-4 rounded-md border border-surface-300 bg-surface-0 p-3',
            applyFix ? 'flex-1 min-h-0' : '',
          ]"
        >
          <!-- 진행 중 섹션 -->
          <div
            :class="[
              'flex flex-col gap-2 rounded bg-blue-50 p-3',
              applyFix ? 'flex-1 min-h-0' : '',
            ]"
          >
            <span class="text-xs font-bold text-blue-900">진행 중 (flex-1, 남은 공간 차지)</span>
            <div
              class="flex flex-1 items-center justify-center rounded border-2 border-dashed border-blue-300 text-sm text-blue-700"
            >
              카드 그리드 영역
            </div>
          </div>

          <!-- 완료 섹션 (자연 높이) -->
          <div class="flex flex-col gap-2 rounded bg-primary-50 p-3">
            <span class="text-xs font-bold text-primary-900">완료 (자연 높이)</span>
            <div class="h-16 rounded bg-primary-100" />
          </div>
        </div>
      </div>
    </div>

    <!-- Code -->
    <div class="flex flex-col gap-2">
      <span class="text-xs font-semibold text-surface-500">코드 (올바른 구조)</span>
      <pre
        class="overflow-auto rounded-lg border border-surface-200 bg-surface-900 p-4 text-sm leading-relaxed text-surface-50"
      ><code>{{ CODE }}</code></pre>
    </div>

    <!-- 핵심 포인트 -->
    <aside class="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h3 class="mb-2 text-sm font-bold text-amber-900">핵심 포인트</h3>
      <ul class="flex flex-col gap-1 text-sm text-amber-900">
        <li>
          flex 자식의 기본값은
          <code class="rounded bg-amber-100 px-1">min-height: auto</code> → 내용보다 작아질 수 없음
        </li>
        <li>
          <code class="rounded bg-amber-100 px-1">min-h-0</code>을 걸어야 content보다 작게 축소
          가능 → flex-1이 제대로 동작
        </li>
        <li>
          <strong>체인</strong>이 핵심 — 루트부터 대상 자식까지 모든 flex column 레이어에 필요
        </li>
        <li>
          스크롤 필요하면 내부 영역에
          <code class="rounded bg-amber-100 px-1">overflow-auto</code> 추가
        </li>
        <li>루트 컨테이너 높이는
          <code class="rounded bg-amber-100 px-1">h-screen</code> /
          <code class="rounded bg-amber-100 px-1">h-full</code> 등으로 정의되어야 함
        </li>
      </ul>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const applyFix = ref(true)

const CODE = `<!-- 루트: 높이 정의 필수 -->
<section class="flex h-full flex-col gap-5">
  <header />  <!-- 자연 높이 -->

  <!-- 중간 래퍼: flex-1 + min-h-0 -->
  <div class="flex flex-1 min-h-0 flex-col gap-5">

    <!-- 진행 중: 남은 공간 차지 -->
    <div class="flex flex-1 min-h-0 flex-col gap-3">
      <h2>진행 중 주문</h2>
      <div class="grid overflow-auto ...">카드 그리드</div>
    </div>

    <!-- 완료: 자연 높이 -->
    <div class="flex flex-col gap-3">
      <h2>주문완료 목록</h2>
      <div class="grid ...">카드 그리드</div>
    </div>
  </div>
</section>`
</script>
