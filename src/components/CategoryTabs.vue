<template>
  <div class="category-tabs flex h-14 items-center gap-1 rounded-lg bg-surface-0 px-3 py-2">
    <button
      v-for="ctg in categories"
      :key="ctg.seq"
      type="button"
      class="flex h-10 w-23 items-center justify-center rounded-lg text-base transition-colors"
      :class="
        modelValue === ctg.seq
          ? 'bg-primary-500 font-semibold text-white'
          : 'border border-surface-200 bg-surface-0 font-medium text-surface-900 hover:border-primary-300'
      "
      @click="emit('update:modelValue', ctg.seq)"
    >
      {{ ctg.nm }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Category {
  seq: number
  nm: string
}

defineProps<{
  categories: readonly Category[]
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [seq: number]
}>()
</script>
