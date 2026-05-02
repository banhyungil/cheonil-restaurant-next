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
import { computed, useAttrs, type ButtonHTMLAttributes } from 'vue'

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

/**
 * native button attrs (onClick, disabled, aria-*, ...) 는 fallthrough.
 * `/* @vue-ignore *\/` 로 SFC 컴파일러는 base type 무시 (runtime props 미생성),
 * type 시스템에선 그대로 inherit → 호출부에서 native attr 타입 검사 통과.
 */
interface BButtonProps extends /* @vue-ignore */ ButtonHTMLAttributes {
  variant?: Variant
  color?: Color
  size?: Size
  loading?: boolean
  rounded?: boolean
}

const props = withDefaults(defineProps<BButtonProps>(), {
  variant: 'filled',
  color: 'primary',
  size: 'md',
})

/** PrimeVue severity — primary 는 기본값(undefined) 이므로 생략. */
const cSeverity = computed(() => (props.color === 'primary' ? undefined : props.color))

/** PrimeVue variant — filled 는 기본값(undefined) 이므로 생략. */
const cVariant = computed(() => (props.variant === 'filled' ? undefined : props.variant))

/**
 * size 토큰 — 프로젝트 Figma 기준 정확 치수.
 * `!` 로 PrimeVue 내부 CSS 를 오버라이드 (cn() 으로 caller class 가 또 덮을 수 있음).
 *
 * `min-w-N` 으로 아이콘 전용 시 정사각형 보장 + 텍스트(+아이콘) 시 width 자유 확장.
 */
const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8.5! min-w-8.5! rounded-md! px-2!',
  md: 'h-10! min-w-10! rounded-lg! px-3!',
  lg: 'h-15! rounded-[10px]! px-5! text-lg! font-bold!',
}

const attrs = useAttrs()

const cRootClass = computed(() =>
  cn('b-button', SIZE_CLASSES[props.size], attrs.class as ClassValue),
)

const cOtherAttrs = computed(() => _.omit(attrs, 'class'))
</script>
