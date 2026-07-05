<!-- 정산 페이지 상단 헤더 — 제목 + 탭. (날짜 네비는 정산 탭 내부 SettlementDateNav 로 이동) -->
<template>
  <header class="settlement-header flex items-center gap-4">
    <h1 class="text-2xl font-bold text-surface-900">정산</h1>

    <BTabs
      :model-value="tab"
      :options="TAB_OPTIONS"
      class="ml-4"
      @update:model-value="emit('update:tab', $event)"
    />
  </header>
</template>

<script setup lang="ts">
export type SettlementTab = 'settle' | 'collect'

const TAB_OPTIONS = [
  { val: 'settle', label: '정산' },
  { val: 'collect', label: '수금' },
] as const

defineProps<{
  tab: SettlementTab
}>()

const emit = defineEmits<{
  'update:tab': [val: SettlementTab]
}>()
</script>
