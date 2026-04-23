<template>
  <div class="store-select-header flex h-12 items-center gap-3">
    <button
      type="button"
      class="flex h-12 flex-1 items-center justify-center gap-1 rounded-[10px] transition-colors"
      :class="
        storeName != null
          ? 'cursor-pointer bg-primary-500 hover:bg-primary-600'
          : 'cursor-default bg-surface-50'
      "
      :disabled="storeName == null"
      :aria-label="storeName != null ? '매장 재선택' : '매장 미지정'"
      @click="storeName != null && emit('change-store')"
    >
      <Store :size="16" :class="storeName != null ? 'text-white' : 'text-surface-500'" />
      <span
        class="text-lg font-semibold"
        :class="storeName != null ? 'text-white' : 'text-surface-500'"
      >
        {{ storeName ?? '미지정' }}
      </span>
    </button>
    <BButton
      variant="outlined"
      color="secondary"
      size="md"
      class="shrink-0 border-surface-200 text-surface-500"
      aria-label="매장 선택 초기화"
      @click="emit('reset')"
    >
      <RotateCcw :size="16" />
    </BButton>
  </div>
</template>

<script setup lang="ts">
import { RotateCcw, Store } from 'lucide-vue-next'

defineProps<{
  /** null 이면 "미지정" 상태 (클릭 비활성) */
  storeName: string | null
}>()

const emit = defineEmits<{
  /** 매장명 영역 클릭 — 매장 재선택 모드로 전환 */
  'change-store': []
  /** 리셋(↺) 버튼 — 완전 초기화 */
  reset: []
}>()
</script>
