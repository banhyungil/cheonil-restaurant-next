<!-- 예약 템플릿 페이지 상단 통계 4 카드 -->
<template>
  <section class="order-rsv-tmpl-stats-cards grid grid-cols-4 gap-3">
    <div
      v-for="card in cCards"
      :key="card.label"
      class="rounded-xl border border-surface-200 bg-white p-4"
    >
      <div class="text-sm text-surface-500">{{ card.label }}</div>
      <div class="mt-1 text-3xl font-bold" :class="card.color">{{ card.value }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { RsvTmplStats } from '@/apis/orderRsvTmplsApi'

const props = defineProps<{
  stats: RsvTmplStats
}>()

const cCards = computed(() => [
  { label: '전체 템플릿', value: `${props.stats.total}개`, color: 'text-surface-900' },
  { label: '활성', value: `${props.stats.active}개`, color: 'text-emerald-600' },
  { label: '비활성', value: `${props.stats.inactive}개`, color: 'text-surface-400' },
  { label: '오늘 자동 생성', value: `${props.stats.generatedToday}건`, color: 'text-blue-600' },
])
</script>
