<template>
  <button type="button" :class="cRootClass" v-bind="cOtherAttrs">
    <slot />
  </button>
</template>

<script setup lang="ts">
import type { ClassValue } from 'clsx'
import _ from 'lodash'
import { computed, useAttrs } from 'vue'

import { cn } from '@/utils/cn'

type Tone = 'primary' | 'outlined' | 'card'
type Size = 'sm' | 'md' | 'lg'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    tone?: Tone
    size?: Size
  }>(),
  { tone: 'primary', size: 'md' },
)

/**
 * 디자인 토큰 분리:
 * - tone: 시각 스타일 (색·hover·active)
 * - size: 치수 (너비·높이·radius·폰트)
 *
 * card tone 은 size 무시 — 카드 높이/레이아웃은 caller 가 class 로 지정.
 * tailwind-merge 로 caller class 가 default 보다 우선 (! 불필요).
 */
const BASE = 'flex transition-colors disabled:cursor-not-allowed'

const TONE_CLASSES: Record<Tone, string> = {
  primary:
    'items-center justify-center bg-primary-500 text-white hover:bg-primary-600 disabled:bg-surface-300',
  outlined:
    'items-center justify-center border border-surface-300 bg-surface-0 text-surface-900 hover:bg-surface-50 disabled:opacity-50',
  card: 'rounded-[10px] border border-surface-200 bg-surface-0 hover:border-primary-300 hover:bg-primary-50/40 active:border-primary-500 active:bg-primary-50',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'size-8.5 rounded-md',
  md: 'size-10 rounded-lg',
  lg: 'h-15 rounded-[10px] text-lg font-bold',
}

const attrs = useAttrs()

// tailwind-merge 기능(cn함수)을 사용하여 class override가 가능하도록 함
const cRootClass = computed(() => {
  const tone = TONE_CLASSES[props.tone]
  const size = props.tone === 'card' ? '' : SIZE_CLASSES[props.size]
  return cn('b-button', BASE, tone, size, attrs.class as ClassValue)
})

const cOtherAttrs = computed(() => _.omit(attrs, 'class'))
</script>
