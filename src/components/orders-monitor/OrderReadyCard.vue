<!-- 진행 중 주문카드 -->
<template>
  <div
    :class="[
      'order-ready-card flex flex-col gap-3 rounded-xl border-2 bg-white p-4',
      STATUS_CLASSES[cElapsed.status].border,
    ]"
  >
    <!-- 헤더: 매장명 + ⓘ tooltip + ⋮ more menu -->
    <div class="flex h-7 items-center gap-2">
      <span class="text-lg font-bold text-surface-900">{{ order.storeNm }}</span>
      <VTooltip v-if="isAll && order.storeCmt" theme="cheonil-tooltip">
        <span
          class="flex size-5 cursor-help items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600"
          tabindex="0"
        >
          i
        </span>
        <template #popper>
          <p class="whitespace-pre-wrap text-base text-surface-900">{{ order.storeCmt }}</p>
        </template>
      </VTooltip>
      <div class="flex-1" />
      <template v-if="isAll">
        <BButton
          variant="text"
          color="secondary"
          size="sm"
          aria-haspopup="true"
          :aria-controls="`order-ready-menu-${order.seq}`"
          @click="onToggleMenu"
        >
          <EllipsisVertical :size="18" />
        </BButton>
        <Menu
          :id="`order-ready-menu-${order.seq}`"
          ref="eltMenu"
          :model="cMenuItems"
          :popup="true"
        />
      </template>
    </div>

    <!-- 시간 row: 주문시각 + 경과 배지 -->
    <OrderTimeBar :orderAt="order.orderAt" />

    <!-- 메뉴 리스트 (자동 n열) -->
    <!-- 그리드 자식요소 크기는 row의 max-content 크기로 자동으로 설정됨 (align-items: stretch) -->
    <div
      class="grid flex-1 grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-y-2 gap-x-3 content-start"
    >
      <div v-for="item in order.menus" :key="item.menuSeq" class="flex h-8 items-center gap-2">
        <span class="truncate text-lg font-semibold text-surface-900">{{ item.menuNm }}</span>
        <div class="flex-1" />
        <span
          class="flex h-5.5 items-center justify-center rounded-lg bg-surface-100 px-2 text-base font-bold text-surface-900"
        >
          ×{{ item.cnt }}
        </span>
      </div>
    </div>

    <!-- 요청사항 -->
    <div v-if="order.cmt" class="flex h-7.5 items-center gap-1.5 rounded-md bg-surface-50 px-2.5">
      <span class="text-base font-semibold text-surface-500">요청사항</span>
      <span class="text-base font-medium text-surface-900">{{ order.cmt }}</span>
    </div>

    <!-- 완료 버튼 -->
    <BButton
      v-if="isAll"
      color="primary"
      class="h-12! w-full! gap-1.5 text-base!"
      @click="emit('complete', order.seq)"
    >
      <Check :size="16" />
      완료
    </BButton>
  </div>
</template>

<script setup lang="ts">
import { Check, EllipsisVertical } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { STATUS_CLASSES, useElapsedTime } from '@/composables/useElapsedTime'
import type { OrderExt } from '@/types/order'

const props = withDefaults(
  defineProps<{
    order: OrderExt
    /** 전체보기 = 액션 포함 / 주방용 = 읽기전용 */
    mode?: 'all' | 'kitchen'
  }>(),
  { mode: 'all' },
)

const emit = defineEmits<{
  complete: [seq: number]
  edit: [seq: number]
  remove: [seq: number]
}>()

const isAll = computed(() => props.mode === 'all')

const cElapsed = useElapsedTime(() => props.order.orderAt)

const eltMenu = ref<{ toggle: (e: Event) => void } | null>(null)

const cMenuItems = computed(() => [
  { label: '수정', command: () => emit('edit', props.order.seq) },
  { label: '삭제', command: () => emit('remove', props.order.seq) },
])

function onToggleMenu(e: Event) {
  eltMenu.value?.toggle(e)
}
</script>
