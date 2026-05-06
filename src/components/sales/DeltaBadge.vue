<!-- 전기 대비 증감 % 뱃지 — ▲ +N.N% (emerald) / ▼ -N.N% (red) / — (gray) -->
<template>
  <span :class="cClass">
    <component v-if="cIcon" :is="cIcon" :size="12" />
    {{ cLabel }}
  </span>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    curr: number
    prev: number
    /** 단위 — 'KRW' (기본) 면 % 만 표시. 'count' 면 절대 차이 + 부호. */
    isCurrency?: boolean
    /** count 모드 suffix ("건"). */
    suffix?: string
  }>(),
  { isCurrency: true, suffix: '' },
)

const cDelta = computed(() => {
  if (props.isCurrency) {
    if (props.prev === 0) return null
    return ((props.curr - props.prev) / props.prev) * 100
  }
  return props.curr - props.prev
})

const cLabel = computed(() => {
  const d = cDelta.value
  if (d == null) return '—'
  const sign = d > 0 ? '+' : ''
  if (props.isCurrency) return `${sign}${d.toFixed(1)}%`
  return `${sign}${d}${props.suffix}`
})

const cIcon = computed(() => {
  const d = cDelta.value
  if (d == null || d === 0) return null
  return d > 0 ? ChevronUp : ChevronDown
})

const cClass = computed(() => {
  const base = 'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium'
  const d = cDelta.value
  if (d == null || d === 0) return `${base} bg-surface-100 text-surface-500`
  if (d > 0) return `${base} bg-emerald-50 text-emerald-700`
  return `${base} bg-red-50 text-red-600`
})
</script>
