<!-- 주문내역관리 그리드 탭 필터 바 — 매장/메뉴/날짜범위/결제수단 + 검색/초기화 -->
<template>
  <div class="sales-grid-filter-bar flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2">
      <Select
        v-model="draft.storeSeq"
        :options="cStoreOptions"
        option-value="val"
        option-label="label"
        placeholder="🏪 매장 검색"
        :show-clear="true"
        filter
        class="w-44"
      />
      <Select
        v-model="draft.menuSeq"
        :options="cMenuOptions"
        option-value="val"
        option-label="label"
        placeholder="🍽 메뉴 검색"
        :show-clear="true"
        filter
        class="w-44"
      />
      <DatePicker
        v-model="cDateRange"
        selection-mode="range"
        date-format="yy-mm-dd"
        show-icon
        :max-date="cToday"
        placeholder="📅 날짜 범위 선택"
        class="w-72"
      />
      <Select
        v-model="draft.payType"
        :options="PAY_OPTIONS"
        option-value="val"
        option-label="label"
        class="w-32"
      />

      <div class="flex-1" />

      <BButton color="primary" :disabled="!cCanSearch" @click="onSearch">
        <Search :size="16" />
        검색
      </BButton>
      <BButton variant="outlined" color="secondary" @click="onReset">
        <RotateCcw :size="16" />
        초기화
      </BButton>
    </div>

    <BInfoBanner v-if="cWarn" severity="warn">
      {{ cWarn }}
    </BInfoBanner>
  </div>
</template>

<script setup lang="ts">
import { differenceInCalendarDays, format, parse } from 'date-fns'
import { RotateCcw, Search } from 'lucide-vue-next'
import { computed, reactive, watch } from 'vue'

import { useMenusQuery } from '@/queries/menusQuery'
import { useStoresQuery } from '@/queries/storesQuery'

import type { OrdersParams } from '@/apis/salesApi'

/** 그리드 탭 필터 — `payType` 만 값 'ALL' 가짐 (전체 = 미지정 의미). */
export interface GridFilter {
  storeSeq: number | null
  menuSeq: number | null
  /** 'YYYY-MM-DD'. */
  from: string | null
  to: string | null
  payType: 'ALL' | 'CASH' | 'CARD' | 'UNPAID'
}

const PAY_OPTIONS: { val: GridFilter['payType']; label: string }[] = [
  { val: 'ALL', label: '전체' },
  { val: 'CASH', label: '현금' },
  { val: 'CARD', label: '카드' },
  { val: 'UNPAID', label: '미수' },
]

/** 날짜 범위 최대 일수 — §7-5. */
const MAX_RANGE_DAYS = 90

const props = defineProps<{
  /** 현재 적용된 필터 — draft 가 없을 때 hydrate 용. */
  filter: GridFilter
}>()

const emit = defineEmits<{
  search: [params: OrdersParams]
  reset: []
}>()

// draft = 사용자가 편집 중인 값. props.filter 변경 시 동기화.
const draft = reactive<GridFilter>({ ...props.filter })

watch(
  () => props.filter,
  (f) => Object.assign(draft, f),
  { deep: true },
)

// DatePicker 어댑터 — Date[] / null
const cDateRange = computed<(Date | null)[] | null>({
  get: () => {
    const f = draft.from ? parse(draft.from, 'yyyy-MM-dd', new Date()) : null
    const t = draft.to ? parse(draft.to, 'yyyy-MM-dd', new Date()) : null
    if (!f && !t) return null
    return [f, t]
  },
  set: (v) => {
    if (!Array.isArray(v) || v.length === 0) {
      draft.from = null
      draft.to = null
      return
    }
    const [f, t] = v
    draft.from = f instanceof Date ? format(f, 'yyyy-MM-dd') : null
    draft.to = t instanceof Date ? format(t, 'yyyy-MM-dd') : null
  },
})

const { data: stores } = useStoresQuery()
const { data: menus } = useMenusQuery(true)

const cStoreOptions = computed(() => (stores.value ?? []).map((s) => ({ val: s.seq, label: s.nm })))
const cMenuOptions = computed(() => (menus.value ?? []).map((m) => ({ val: m.seq, label: m.nm })))

/** 오늘 자정 — DatePicker `max-date` 로 미래 날짜 선택 차단. */
const cToday = computed(() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})

/** 범위 일수 (양 끝 포함). 미지정이면 null. */
const cRangeDays = computed<number | null>(() => {
  if (!draft.from || !draft.to) return null
  const f = parse(draft.from, 'yyyy-MM-dd', new Date())
  const t = parse(draft.to, 'yyyy-MM-dd', new Date())
  return differenceInCalendarDays(t, f) + 1
})

const cWarn = computed(() => {
  if (cRangeDays.value == null) return '날짜 범위를 선택해주세요.'
  if (cRangeDays.value > MAX_RANGE_DAYS)
    return `최대 ${MAX_RANGE_DAYS}일 (3개월) 까지만 조회할 수 있습니다. 현재 ${cRangeDays.value}일.`
  return null
})

const cCanSearch = computed(
  () => draft.from != null && draft.to != null && (cRangeDays.value ?? 0) <= MAX_RANGE_DAYS,
)

function onSearch() {
  if (!cCanSearch.value || !draft.from || !draft.to) return
  emit('search', {
    from: draft.from,
    to: draft.to,
    storeSeq: draft.storeSeq ?? undefined,
    menuSeq: draft.menuSeq ?? undefined,
    payType: draft.payType === 'ALL' ? undefined : draft.payType,
  })
}

function onReset() {
  draft.storeSeq = null
  draft.menuSeq = null
  draft.from = null
  draft.to = null
  draft.payType = 'ALL'
  emit('reset')
}
</script>
