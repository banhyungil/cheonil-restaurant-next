<template>
  <Button
    :severity="cSeverity"
    :variant="cVariant"
    :loading="loading"
    :rounded="rounded"
    :class="cRootClass"
    v-bind="cOtherAttrs"
  >
    <slot />
  </Button>
</template>

<script setup lang="ts">
import type { ClassValue } from 'clsx'
import _ from 'lodash'
import { computed, useAttrs } from 'vue'

import { cn } from '@/utils/cn'

/**
 * 프로젝트 표준 버튼 — PrimeVue Button 의 얇은 래퍼.
 *
 * PrimeVue 의 severity × variant × 내장 기능 (loading, rounded, raised 등) 을 그대로 활용하면서,
 * 우리 Figma 사양에 맞춘 **size 토큰 3종** (sm / md / lg) 만 추가.
 *
 * size 는 PrimeVue 의 small/large 와 치수가 달라 Tailwind 로 직접 제어.
 */

type Variant = 'filled' | 'outlined' | 'text' | 'link'
type Color = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast'
type Size = 'sm' | 'md' | 'lg'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    variant?: Variant
    color?: Color
    size?: Size
    loading?: boolean
    rounded?: boolean
  }>(),
  {
    variant: 'filled',
    color: 'primary',
    size: 'md',
  },
)

/** PrimeVue severity — primary 는 기본값(undefined) 이므로 생략. */
const cSeverity = computed(() => (props.color === 'primary' ? undefined : props.color))

/** PrimeVue variant — filled 는 기본값(undefined) 이므로 생략. */
const cVariant = computed(() => (props.variant === 'filled' ? undefined : props.variant))

/**
 * size 토큰 — 프로젝트 Figma 기준 정확 치수.
 * `!` 로 PrimeVue 내부 CSS 를 오버라이드 (cn() 으로 caller class 가 또 덮을 수 있음).
 */
const SIZE_CLASSES: Record<Size, string> = {
  sm: 'size-8.5! rounded-md! p-0!',
  md: 'size-10! rounded-lg! p-0!',
  lg: 'h-15! rounded-[10px]! px-5! text-lg! font-bold!',
}

const attrs = useAttrs()

const cRootClass = computed(() =>
  cn('b-button', SIZE_CLASSES[props.size], attrs.class as ClassValue),
)

const cOtherAttrs = computed(() => _.omit(attrs, 'class'))
</script>
