<template>
  <div class="cart-empty-state flex flex-1 flex-col items-center justify-center gap-3">
    <div
      class="flex size-24 items-center justify-center rounded-full bg-surface-50 text-4xl"
    >
      {{ icon }}
    </div>
    <p class="text-lg font-semibold text-surface-500">{{ title }}</p>
    <p class="text-base text-surface-500">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    title: string
    description: string
  }>(),
  { icon: '🏪' },
)
</script>
