<!-- 정산 탭 단일 날짜 네비 — `< [날짜] > [오늘]`. -->
<template>
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
      <DatePicker inline :model-value="cDateObj" @update:model-value="onSelectDate" />
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
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { vTooltip } from 'floating-vue'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type Popover from 'primevue/popover'
import { computed, ref } from 'vue'

const props = defineProps<{
  /** 'YYYY-MM-DD'. */
  date: string
  isToday: boolean
}>()

const emit = defineEmits<{
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

const cDateLabel = computed(() => format(cDateObj.value, 'yyyy.MM.dd (eee)', { locale: ko }))

function onTogglePicker(e: Event) {
  popoverRef.value?.toggle(e)
}

function onSelectDate(d: Date | Date[] | (Date | null)[] | null | undefined) {
  if (!(d instanceof Date)) return
  emit('update:date', format(d, 'yyyy-MM-dd'))
  popoverRef.value?.hide()
}
</script>
