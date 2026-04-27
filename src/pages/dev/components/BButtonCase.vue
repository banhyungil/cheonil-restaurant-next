<template>
  <section class="b-button-showcase flex flex-col gap-10">
    <!-- Icon buttons (size: md) — variant × color 매트릭스 -->
    <div>
      <h2 class="mb-1 text-lg font-semibold text-surface-900">Icon Buttons</h2>
      <p class="mb-4 text-sm text-surface-500">size="md" — variant × color</p>
      <div class="flex flex-col gap-3">
        <div v-for="color in COLORS" :key="color" class="flex items-center gap-3">
          <span class="w-24 text-sm text-surface-500">{{ color }}</span>
          <BButton
            v-for="variant in VARIANTS"
            :key="variant"
            :variant="variant"
            :color="color"
            :aria-label="`${color}-${variant}`"
            v-tooltip="`${color}-${variant}`"
          >
            <Plus :size="16" />
          </BButton>
        </div>
      </div>
    </div>

    <!-- Text CTAs (size: lg) — variant × color 매트릭스 -->
    <div>
      <h2 class="mb-1 text-lg font-semibold text-surface-900">Text CTAs</h2>
      <p class="mb-4 text-sm text-surface-500">size="lg" — variant × color</p>
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <span class="w-24 text-sm text-surface-500">{{ 'primary' }}</span>
          <BButton
            v-for="variant in VARIANTS"
            :key="variant"
            :variant="variant"
            color="primary"
            size="lg"
          >
            {{ variant }}
          </BButton>
        </div>
      </div>
    </div>

    <!-- Sizes (color: primary, variant: filled) -->
    <div>
      <h2 class="mb-1 text-lg font-semibold text-surface-900">Sizes</h2>
      <p class="mb-4 text-sm text-surface-500">color="primary", variant="filled"</p>
      <div class="flex items-center gap-3">
        <BButton v-for="size in SIZES" :key="size" :size="size" :aria-label="size">
          {{ size }}
        </BButton>
      </div>
    </div>

    <!-- States -->
    <div>
      <h2 class="mb-1 text-lg font-semibold text-surface-900">States</h2>
      <p class="mb-4 text-sm text-surface-500">
        loading / disabled / rounded — color="primary", variant="filled", size="lg"
      </p>
      <div class="flex items-center gap-3">
        <BButton size="lg">Normal</BButton>
        <BButton size="lg" disabled>Disabled</BButton>
        <BButton size="lg" loading>Loading</BButton>
        <BButton size="lg" rounded>Rounded</BButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

const VARIANTS = ['filled', 'outlined', 'text', 'link'] as const
const SIZES = ['sm', 'md', 'lg'] as const
const COLORS = [
  'primary',
  'secondary',
  'success',
  'info',
  'warn',
  'help',
  'danger',
  'contrast',
] as const
</script>
