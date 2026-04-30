<!-- 반복 요일 선택 — 월~일 7개 토글 (multiple) -->
<template>
  <div class="day-type-selector flex gap-1">
    <button
      v-for="day in DAY_TYPES"
      :key="day"
      type="button"
      :class="[
        'flex h-9 w-9 items-center justify-center rounded text-sm font-medium transition-colors',
        modelValue.includes(day)
          ? 'bg-primary-500 text-white'
          : 'bg-surface-100 text-surface-700 hover:bg-surface-200',
      ]"
      @click="onToggle(day)"
    >
      {{ DAY_LABEL[day] }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { DayType } from '@/types/orderRsv'

const DAY_TYPES: DayType[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const DAY_LABEL: Record<DayType, string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
}

const props = defineProps<{
  modelValue: DayType[]
}>()

const emit = defineEmits<{
  'update:modelValue': [val: DayType[]]
}>()

function onToggle(day: DayType) {
  const set = new Set(props.modelValue)
  if (set.has(day)) set.delete(day)
  else set.add(day)
  // 원본 배열 순서(월~일) 유지하여 emit
  emit(
    'update:modelValue',
    DAY_TYPES.filter((d) => set.has(d)),
  )
}
</script>
