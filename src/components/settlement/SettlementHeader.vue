<!-- 정산 페이지 상단 헤더 — 제목 + 탭 + 단일 날짜 네비 -->
<template>
  <header class="settlement-header flex items-center gap-4">
    <h1 class="text-2xl font-bold text-surface-900">정산</h1>

    <BTabs
      :model-value="tab"
      :options="TAB_OPTIONS"
      class="ml-4"
      @update:model-value="emit('update:tab', $event)"
    />

    <div class="flex-1" />

    <!-- 날짜 네비 — 두 탭 모두 노출. 수금 탭에서도 미리 날짜 골라두면 정산 탭으로 돌아올 때 그 날짜로 조회. -->
    <div class="flex items-center gap-2">
      <BButton
        v-tooltip="'이전 날'"
        variant="outlined"
        color="secondary"
        size="sm"
        @click="emit('prev')"
      >
        <ChevronLeft :size="16" />
      </BButton>

      <button
        v-tooltip="'날짜 선택'"
        type="button"
        class="flex min-w-40 items-center justify-center gap-1.5 rounded-md border border-surface-200 bg-surface-0 px-3 py-1.5 text-base font-semibold text-surface-900 transition-colors hover:border-primary-300 hover:bg-surface-50"
        @click="onTogglePicker"
      >
        <CalendarDays :size="16" class="text-surface-500" />
        {{ cDateLabel }}
      </button>

      <Popover ref="popoverRef">
        <DatePicker
          inline
          :model-value="cDateObj"
          @update:model-value="onSelectDate"
        />
      </Popover>

      <BButton
        v-tooltip="'다음 날'"
        variant="outlined"
        color="secondary"
        size="sm"
        @click="emit('next')"
      >
        <ChevronRight :size="16" />
      </BButton>

      <BButton
        :variant="isToday ? 'filled' : 'outlined'"
        :color="isToday ? 'primary' : 'secondary'"
        size="sm"
        @click="emit('today')"
      >
        오늘
      </BButton>
    </div>
  </header>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { vTooltip } from 'floating-vue'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type Popover from 'primevue/popover'
import { computed, ref } from 'vue'

export type SettlementTab = 'settle' | 'collect'

const TAB_OPTIONS = [
  { val: 'settle', label: '정산' },
  { val: 'collect', label: '수금' },
] as const

const props = defineProps<{
  tab: SettlementTab
  /** 'YYYY-MM-DD'. 정산 탭일 때만 사용. */
  date: string
  isToday: boolean
}>()

const emit = defineEmits<{
  'update:tab': [val: SettlementTab]
  'update:date': [val: string]
  prev: []
  next: []
  today: []
}>()

const popoverRef = ref<InstanceType<typeof Popover> | null>(null)

const cDateObj = computed<Date>(() => {
  const [y, m, d] = props.date.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
})

const cDateLabel = computed(() =>
  format(cDateObj.value, 'yyyy.MM.dd (eee)', { locale: ko }),
)

function onTogglePicker(e: Event) {
  popoverRef.value?.toggle(e)
}

function onSelectDate(d: Date | Date[] | (Date | null)[] | null | undefined) {
  if (!(d instanceof Date)) return
  emit('update:date', format(d, 'yyyy-MM-dd'))
  popoverRef.value?.hide()
}
</script>
