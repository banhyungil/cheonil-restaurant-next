<!-- 진행 중 예약 카드 -->
<template>
  <div
    :class="[
      'order-rsv-ready-card flex flex-col gap-3 rounded-xl border-2 bg-white p-4',
      REMAINING_STATUS_CLASSES[cRemaining.status].border,
    ]"
  >
    <!-- 헤더: 매장명 + 예약시각(HH:mm) + ⋮(수정/삭제) -->
    <div class="flex items-center gap-2">
      <span class="text-lg font-bold text-surface-900">{{ rsv.storeNm }}</span>
      <div class="flex-1" />
      <span class="text-lg font-bold text-surface-900">{{
        format(new Date(rsv.rsvAt), 'HH:mm')
      }}</span>
      <BButton
        variant="text"
        color="secondary"
        size="sm"
        aria-haspopup="true"
        :aria-controls="`order-rsv-ready-menu-${rsv.seq}`"
        @click="onToggleMenu"
      >
        <EllipsisVertical :size="18" />
      </BButton>
      <Menu
        :id="`order-rsv-ready-menu-${rsv.seq}`"
        ref="eltMenu"
        :model="cMenuItems"
        :popup="true"
      />
    </div>

    <!-- TODO 출처칩(#템플릿명 / #일회성) + 남은시간 배지 -->
    <div class="flex items-center gap-2">
      <span class="rounded bg-surface-100 px-2 py-0.5 text-sm">
        #{{ rsv.tmplNm ?? '일회성' }}
      </span>
      <div class="flex-1" />
      <span
        :class="[
          'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium',
          REMAINING_STATUS_CLASSES[cRemaining.status].badgeBg,
          REMAINING_STATUS_CLASSES[cRemaining.status].badgeText,
        ]"
      >
        🕐 {{ cRemaining.label }}
      </span>
    </div>

    <!-- TODO 메뉴 리스트 (이름 ····· ×수량) -->
    <div
      class="grid flex-1 grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-y-2 gap-x-3 content-start mb-2"
    >
      <div v-for="m in rsv.menus" :key="m.menuSeq" class="flex h-8 items-center gap-2">
        <span class="truncate text-lg font-semibold text-surface-900">{{ m.menuNm }}</span>
        <div class="flex-1" />
        <span
          class="flex h-5.5 items-center justify-center rounded-lg bg-surface-100 px-2 text-base font-bold text-surface-900"
        >
          ×{{ m.cnt }}
        </span>
      </div>
    </div>

    <!-- TODO 메모 (있을 때만): 📝 -->
    <div v-if="rsv.cmt" class="rounded bg-surface-50 px-2 py-1 text-xs text-surface-600">
      📝 {{ rsv.cmt }}
    </div>

    <!-- TODO 액션: [✓ 주문 접수] (primary, 2/3) · [취소] (outlined danger, 1/3) -->
    <div class="flex gap-2">
      <BButton
        color="primary"
        class="flex-2 rounded border border-primary-500 py-2"
        @click="emit('accept', rsv.seq)"
      >
        <Check :size="16" />
        주문 접수
      </BButton>
      <BButton
        color="danger"
        variant="outlined"
        class="flex-1 rounded border"
        @click="emit('cancel', rsv.seq)"
      >
        취소
      </BButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { Check, EllipsisVertical } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { REMAINING_STATUS_CLASSES, useRsvRemainingTime } from '@/composables/useRsvRemainingTime'
import type { OrderRsvExt } from '@/types/orderRsv'

import type { MenuItem } from 'primevue/menuitem'

const props = defineProps<{
  rsv: OrderRsvExt
}>()

const emit = defineEmits<{
  accept: [seq: number]
  cancel: [seq: number]
  edit: [seq: number]
  remove: [seq: number]
}>()

const cRemaining = useRsvRemainingTime(() => props.rsv.rsvAt)

const eltMenu = ref<{ toggle: (e: Event) => void } | null>(null)

const cMenuItems = computed<MenuItem[]>(() => [
  { label: '수정', command: () => emit('edit', props.rsv.seq) },
  { label: '삭제', command: () => emit('remove', props.rsv.seq) },
])

function onToggleMenu(e: Event) {
  eltMenu.value?.toggle(e)
}
</script>
