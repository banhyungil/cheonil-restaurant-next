<template>
  <InputText v-bind="props" @update:model-value="onUpdate" />
</template>

<script setup lang="ts">
import InputText, { type InputTextProps } from 'primevue/inputtext'

/**
 * PrimeVue InputText 의 얇은 래퍼.
 *
 * PrimeVue `update:modelValue` emit 이 `string | undefined` 라
 * 호출부 `Ref<string>` v-model 양방향 바인딩이 strict template type-check 에서 깨짐.
 * 본 래퍼가 emit 을 `string` 으로 normalize.
 *
 * `/* @vue-ignore *\/` 로 SFC 컴파일러는 InputTextProps 무시 (runtime props 미생성),
 * type 시스템에선 그대로 inherit. modelValue 는 v-model 양방향을 위해 own prop 으로
 * 명시 — 그래야 SFC 컴파일러가 runtime props 에 등록. native attrs (placeholder,
 * disabled 등) 는 attrs fallthrough 로 InputText root 에 자동 적용.
 */
type BInputTextOwnProps = { modelValue?: string | null }
type BInputTextProps = BInputTextOwnProps & /* @vue-ignore */ InputTextProps

const props = defineProps<BInputTextProps>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onUpdate(value: string | undefined) {
  emit('update:modelValue', value ?? '')
}
</script>
