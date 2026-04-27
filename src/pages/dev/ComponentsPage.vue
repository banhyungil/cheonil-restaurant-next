<!-- 공통 컴포넌트 (B*) 프리뷰 / 파악용 페이지 -->
<template>
  <div class="components-page flex h-full flex-col gap-6 bg-surface-50 px-8 py-6">
    <header class="flex items-center gap-4">
      <h1 class="text-xl font-bold text-surface-900">공통 컴포넌트</h1>
      <Select
        v-model="selComponent"
        :options="[...COMPONENT_OPTIONS]"
        option-label="label"
        option-value="value"
        class="w-56"
      />
    </header>

    <div class="flex-1 overflow-auto rounded-xl border border-surface-200 bg-surface-0 p-8">
      <BButtonCase v-if="selComponent === 'BButton'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BButtonCase from './components/BButtonCase.vue'

const COMPONENT_OPTIONS = [{ label: 'BButton', value: 'BButton' }] as const

const selComponent = ref<string>('BButton')
</script>
