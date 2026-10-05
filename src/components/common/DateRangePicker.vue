<!-- 날짜 범위 선택 — v-model:from / v-model:to ('YYYY-MM-DD', 미선택은 '') -->
<template>
  <DatePicker
    :model-value="cDateRange"
    selection-mode="range"
    date-format="yy-mm-dd"
    show-icon
    :max-date="cMaxDate"
    placeholder="📅 날짜 범위 선택"
    @update:model-value="(v) => (cDateRange = v as (Date | null)[] | null)"
    @hide="onHide"
  />
</template>

<script setup lang="ts">
import { addDays, format, min, parse } from 'date-fns'
import DatePicker from 'primevue/datepicker'

/**
 * 수금탭(CollectionTab) 의 범위 선택 방식을 재사용 가능하게 분리.
 *
 * - 시작일 → 종료일 순차 선택. 선택 중엔 [start, null] 로 두어 다음 클릭을 종료일로 받는다
 *   (end 를 채우면 범위 완료로 인식해 다음 클릭이 새 시작일이 됨)
 * - 종료일 선택 중엔 시작일 + (maxDays - 1) 일까지만 선택 가능, 미래 날짜는 불가
 * - 시작일만 고르고 닫으면 단일일 범위로 확정
 */
const props = withDefaults(defineProps<{ maxDays?: number }>(), { maxDays: 90 })

const from = defineModel<string>('from', { default: '' })
const to = defineModel<string>('to', { default: '' })

const parseDt = (s: string) => parse(s, 'yyyy-MM-dd', new Date())

const cDateRange = computed<(Date | null)[] | null>({
  get: () => {
    if (!from.value && !to.value) return null
    return [from.value ? parseDt(from.value) : null, to.value ? parseDt(to.value) : null]
  },
  set: (v) => {
    if (!Array.isArray(v) || !(v[0] instanceof Date)) return
    const [f, t] = v
    from.value = format(f, 'yyyy-MM-dd')
    to.value = t instanceof Date ? format(t, 'yyyy-MM-dd') : ''
  },
})

function onHide() {
  if (from.value && !to.value) to.value = from.value
}

const cToday = computed(() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})

const cMaxDate = computed(() => {
  if (!from.value || to.value) return cToday.value
  return min([addDays(parseDt(from.value), props.maxDays - 1), cToday.value])
})
</script>
