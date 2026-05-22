<!-- 주방용 진행 중 주문카드 (읽기전용, size 별 텍스트 확대) -->
<template>
  <div
    :class="[
      'order-ready-kitchen-card flex flex-col gap-4 rounded-xl border-2 bg-white p-4',
      STATUS_CLASSES[cElapsed.status].border,
    ]"
  >
    <!-- 헤더: full-width 매장명, 카드 가장자리까지 확장 -->
    <div class="flex items-center gap-2 -mx-4 -mt-4 mb-4">
      <div
        :class="[
          'grid grid-cols-[1fr_auto_1fr] flex-1 items-center rounded-t-[10px] font-bold text-surface-900',
          cSize.text,
          cSize.headerPd,
          STATUS_CLASSES[cElapsed.status].timeRowBg,
        ]"
      >
        <div />
        <span>{{ order.storeNm }}</span>
        <span class="justify-self-end pr-2 text-[0.7em] text-blue-500">
          <template v-if="order.rsvAt">
            <CalendarCheck class="size-[1em] inline" /> {{ format(order.rsvAt, 'h:mm') }}
          </template>
        </span>
      </div>
    </div>

    <!-- 메뉴 리스트 -->
    <div class="grid flex-1 content-start mb-2" :class="[cSize.gridCols, cSize.gapX, cSize.gapY]">
      <div v-for="item in order.menus" :key="item.menuSeq" class="flex items-center gap-2">
        <span class="font-semibold text-surface-900" :class="cSize.text">
          {{ item.menuNmS }}
        </span>
        <div class="flex-1" />
        <span
          :class="[
            'flex items-center justify-center rounded-lg font-bold',
            cSize.text,
            cSize.countPd,
            cCountClass(item.cnt),
          ]"
        >
          <span class="text-[0.9em]">×</span><span>{{ item.cnt }}</span>
        </span>
      </div>
    </div>

    <!-- 요청사항 -->
    <div v-if="order.cmt" class="flex h-7.5 items-center gap-1.5 rounded-md bg-surface-50 px-2.5">
      <span class="text-base font-semibold text-surface-500">요청사항</span>
      <span class="text-base font-medium text-surface-900">{{ order.cmt }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'

import { STATUS_CLASSES, useElapsedTime } from '@/composables/useElapsedTime'
import type { OrderExt } from '@/types/order'
import { CalendarCheck } from 'lucide-vue-next'

type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    order: OrderExt
    /** 주방 모니터 크기에 맞춰 조정 */
    size?: Size
  }>(),
  { size: 'md' },
)

const SIZE_CLASSES: Record<
  Size,
  { text: string; headerPd: string; countPd: string; gridCols: string; gapX: string; gapY: string }
> = {
  sm: {
    text: 'text-3xl',
    headerPd: 'py-2',
    countPd: 'px-3 py-1',
    gridCols: 'grid-cols-[repeat(auto-fill,minmax(180px,1fr))]',
    gapX: 'gap-x-3',
    gapY: 'gap-y-2',
  },
  md: {
    text: 'text-4xl',
    headerPd: 'py-2.5',
    countPd: 'px-3 py-1.5',
    gridCols: 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))]',
    gapX: 'gap-x-3',
    gapY: 'gap-y-3',
  },
  lg: {
    text: 'text-5xl',
    headerPd: 'py-3',
    countPd: 'px-4 py-2',
    gridCols: 'grid-cols-[repeat(auto-fill,minmax(240px,1fr))]',
    gapX: 'gap-x-4',
    gapY: 'gap-y-4',
  },
}

const cSize = computed(() => SIZE_CLASSES[props.size])

/** 수량별 배지 색상 — heatmap (1: 중성, 2~3: 보라/푸시아, 4+: 로즈). */
const COUNT_CLASSES: Record<1 | 2 | 3 | 4, string[]> = {
  1: ['bg-surface-100', 'text-surface-600'],
  2: ['bg-surface-100', 'text-slate-600'],
  3: ['bg-surface-100', 'text-slate-700'],
  4: ['bg-surface-100', 'text-slate-900'],
}

function cCountClass(cnt: number) {
  return COUNT_CLASSES[Math.min(Math.max(cnt, 1), 4) as 1 | 2 | 3 | 4]
}

const cElapsed = useElapsedTime(
  () => props.order.rsvAt ?? props.order.orderAt,
  () => (props.order.rsvAt ? 'rsv' : 'order'),
)
</script>
