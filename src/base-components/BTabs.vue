<template>
  <SelectButton
    :model-value="modelValue"
    :options="[...options]"
    option-value="seq"
    option-label="nm"
    :allow-empty="false"
    :pt="cPt"
    v-bind="cOtherAttrs"
    @update:model-value="onChange"
  />
</template>

<script setup lang="ts">
import type { ClassValue } from 'clsx'
import _ from 'lodash'
import { computed, useAttrs } from 'vue'

import { cn } from '@/utils/cn'
import type { SelectButtonPassThroughOptions } from 'primevue/selectbutton'

/**
 * 탭 / 세그먼트 선택 컴포넌트 — PrimeVue SelectButton 의 얇은 래퍼.
 *
 * API 는 B* 컴포넌트 공통 3축 (variant × color × size) 유지.
 * 현재는 각 축이 1 value 씩이지만, 요구 생길 때마다 **값만 확장**.
 *
 * 활성 상태는 PrimeVue ToggleButton 의 `data-p-checked="true"` 속성을
 * Tailwind `data-[p-checked=true]:...` variant 로 감지해서 스타일 분기.
 */

type TabOption = { seq: number; nm: string }

type Variant = 'segmented' // 차후 'underline' | 'card'
type Color = 'primary' // 차후 'secondary' | 'danger'
type Size = 'md' // 차후 'sm' | 'lg'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    options: readonly TabOption[]
    modelValue: number
    variant?: Variant
    color?: Color
    size?: Size
  }>(),
  {
    variant: 'segmented',
    color: 'primary',
    size: 'md',
  },
)

const emit = defineEmits<{
  'update:modelValue': [seq: number]
}>()

function onChange(v: unknown) {
  if (typeof v === 'number') emit('update:modelValue', v)
}

/** size 별 컨테이너 / 탭 치수 */
const CONTAINER_SIZE: Record<Size, string> = {
  md: 'h-14 gap-1 rounded-lg px-3 py-2',
}

const TAB_SIZE: Record<Size, string> = {
  md: 'h-10 w-23 rounded-lg text-base',
}

/** color 별 active 상태 — data-p-checked='true' 일 때만 적용 */
const ACTIVE_BY_COLOR: Record<Color, string> = {
  primary:
    'data-[p-checked=true]:border-transparent data-[p-checked=true]:bg-primary-500 data-[p-checked=true]:font-semibold data-[p-checked=true]:text-white',
}

const INACTIVE_STYLE =
  'border border-surface-200 bg-surface-0 font-medium text-surface-900 hover:border-primary-300'

const attrs = useAttrs()

const cPt = computed<SelectButtonPassThroughOptions>(() => ({
  root: {
    class: cn(
      'b-tabs flex items-center bg-surface-0',
      CONTAINER_SIZE[props.size],
      attrs.class as ClassValue,
    ),
  },
  pcToggleButton: {
    root: {
      class: cn(
        'flex items-center justify-center transition-colors',
        TAB_SIZE[props.size],
        INACTIVE_STYLE,
        ACTIVE_BY_COLOR[props.color],
      ),
    },
    // PrimeVue 내부 content span 이 자체 bg 를 가지므로 투명화해서 root bg 가 보이게 함
    content: {
      class: 'bg-transparent',
    },
    // label 색이 inherit 되도록 (root 의 text-color 그대로 상속)
    label: {
      class: 'text-inherit',
    },
  },
}))

const cOtherAttrs = computed(() => _.omit(attrs, 'class'))
</script>
