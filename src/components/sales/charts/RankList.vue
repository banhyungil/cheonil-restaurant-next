<!-- 메뉴 TOP N / 인기메뉴 등 — 순위 list (차트 X) -->
<template>
  <div class="rank-list flex flex-col gap-2 rounded-lg border border-surface-200 bg-surface-0 p-4">
    <h3 class="text-sm font-semibold text-surface-900">{{ title }}</h3>
    <ol class="flex flex-col gap-1.5">
      <li v-for="(r, i) in rows" :key="r.label" class="flex items-center gap-3 text-sm">
        <span class="w-5 text-center font-semibold text-surface-500">{{ i + 1 }}</span>
        <span class="flex-1 truncate text-surface-900">{{ r.label }}</span>
        <span class="font-semibold text-emerald-600">{{ cFmt(r.value) }}</span>
      </li>
    </ol>
    <div v-if="rows.length === 0" class="py-4 text-center text-sm text-surface-500">
      데이터가 없습니다
    </div>
  </div>
</template>

<script setup lang="ts">
interface Row {
  label: string
  value: number
}

const props = withDefaults(
  defineProps<{
    title: string
    rows: readonly Row[]
    /** 'count' (기본) → "N건" / 'KRW' → "N,NNN원" */
    unit?: 'count' | 'KRW'
  }>(),
  { unit: 'count' },
)

function cFmt(v: number): string {
  return props.unit === 'KRW' ? `${v.toLocaleString()}원` : `${v.toLocaleString()}건`
}
</script>
