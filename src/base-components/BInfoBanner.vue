<template>
  <div :class="cClass">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 인라인 안내 배너 — 정렬 모드 hint, 임시 공지 등 약한 강조용.
 * Toast 보다 영구적이고 Alert 보다 가벼움.
 *
 * @example
 *   <BInfoBanner>💡 드래그로 순서를 변경하세요</BInfoBanner>
 *   <BInfoBanner severity="warn">⚠ 변경 사항이 저장되지 않았습니다</BInfoBanner>
 */
type Severity = 'info' | 'warn' | 'success'

const props = withDefaults(
  defineProps<{
    severity?: Severity
  }>(),
  { severity: 'info' },
)

const SEVERITY_CLASSES: Record<Severity, string> = {
  info: 'bg-primary-50 text-primary-700',
  warn: 'bg-amber-50 text-amber-700',
  success: 'bg-emerald-50 text-emerald-700',
}

const cClass = computed(
  () => `b-info-banner rounded-lg px-4 py-2 text-sm ${SEVERITY_CLASSES[props.severity]}`,
)
</script>
