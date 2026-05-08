<!-- 진행 중 주문카드 -->
<template>
  <div
    :class="[
      'order-ready-card flex flex-col gap-4 rounded-xl border-2 bg-white p-4',
      STATUS_CLASSES[cElapsed.status].border,
    ]"
  >
    <!-- 헤더: 매장명 + 예약 배지 + ⓘ tooltip + ⋮ more menu — KITCHEN 모드는 매장명 full-width -->
    <div class="flex h-7 items-center gap-2">
      <!-- 좌측 컬러바 + bg / KITCHEN: full-width + text-center -->
      <span
        class="font-bold text-surface-900"
        :class="
          cIsKichen
            ? [
                'flex-1 text-center text-3xl border-l-4 pl-3 pr-2 py-1 rounded-md',
                STATUS_CLASSES[cElapsed.status].border,
                STATUS_CLASSES[cElapsed.status].timeRowBg,
              ]
            : 'text-lg'
        "
        >{{ order.storeNm }}</span
      >

      <span
        v-if="order.rsvSeq != null && cIsAll"
        class="flex items-center gap-1 rounded-md bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700"
        v-tooltip.right="'예약주문'"
      >
        <CalendarCheck :size="12" />
      </span>
      <vTooltip v-if="cIsAll && order.storeCmt">
        <span
          class="flex size-5 cursor-help items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600"
          tabindex="0"
        >
          i
        </span>
        <template #popper>
          <p class="whitespace-pre-wrap text-base text-surface-900">{{ order.storeCmt }}</p>
        </template>
      </vTooltip>
      <div v-if="cIsAll" class="flex-1" />
      <template v-if="cIsAll">
        <BButton
          variant="text"
          color="secondary"
          size="sm"
          aria-haspopup="true"
          @click="onToggleMenu"
        >
          <EllipsisVertical :size="18" />
        </BButton>
        <Menu ref="eltMenu" :model="cMenuItems" :popup="true" />
      </template>
    </div>

    <!-- 시간 row: 예약이면 rsvAt + 잔여/경과, 일반이면 orderAt + 경과. KITCHEN 은 예약 주문에만 노출. -->
    <OrderTimeBar
      v-if="cIsAll || order.rsvAt"
      :order-at="order.orderAt"
      :rsv-at="order.rsvAt"
      :kitchen="cIsKichen"
    />

    <!-- 메뉴 리스트 (자동 n열) -->
    <!-- 그리드 자식요소 크기는 row의 max-content 크기로 자동으로 설정됨 (align-items: stretch) -->
    <div
      class="grid flex-1 grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-y-2 gap-x-3 content-start mb-2"
    >
      <div v-for="item in order.menus" :key="item.menuSeq" class="flex min-h-8 items-center gap-2">
        <span
          class="line-clamp-2 font-semibold text-surface-900"
          :class="cIsKichen ? 'text-3xl' : 'text-lg'"
          >{{ item.menuNmS }}</span
        >
        <div class="flex-1" />
        <span
          class="flex h-5.5 items-center justify-center rounded-lg bg-surface-100 px-2 ext-base font-bold text-surface-900"
          :class="cIsKichen ? 'text-3xl' : 'text-base'"
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
      v-if="cIsAll"
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
import { CalendarCheck, Check, EllipsisVertical } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { STATUS_CLASSES, useElapsedTime } from '@/composables/useElapsedTime'
import type { OrderExt } from '@/types/order'
import type { MenuItem } from 'primevue/menuitem'
import { vTooltip } from 'floating-vue'

const props = withDefaults(
  defineProps<{
    order: OrderExt
    /** 전체보기 = 액션 포함 / 주방용 = 읽기전용 */
    mode?: 'ALL' | 'KITCHEN'
  }>(),
  { mode: 'ALL' },
)

const emit = defineEmits<{
  complete: [seq: number]
  edit: [seq: number]
  remove: [seq: number]
}>()

const cIsAll = computed(() => props.mode === 'ALL')
const cIsKichen = computed(() => props.mode === 'KITCHEN')

const cElapsed = useElapsedTime(
  () => props.order.rsvAt ?? props.order.orderAt,
  () => (props.order.rsvAt ? 'rsv' : 'order'),
)

const eltMenu = ref<{ toggle: (e: Event) => void } | null>(null)

const cMenuItems = computed<MenuItem[]>(() => [
  { label: '수정', command: () => emit('edit', props.order.seq) },
  { label: '삭제', command: () => emit('remove', props.order.seq) },
])

function onToggleMenu(e: Event) {
  eltMenu.value?.toggle(e)
}
</script>
