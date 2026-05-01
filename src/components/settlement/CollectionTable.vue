<!-- 수금 탭 — 날짜 기반 거래 (paid + unpaid) / 토글 ON 시 모든 미수 (날짜 무관) -->
<template>
  <div class="collection-table flex flex-col gap-3">
    <!-- 헤더 정보 + 토글 + 매장 검색 -->
    <div class="flex items-center gap-3">
      <span class="text-base font-semibold text-surface-900">
        {{ cHeaderLabel }}
      </span>
      <div class="flex-1" />

      <label class="flex items-center gap-2 text-sm text-surface-700">
        모든 미수 보기
        <ToggleSwitch
          :model-value="showAllUnpaid"
          @update:model-value="emit('update:showAllUnpaid', $event as boolean)"
        />
      </label>

      <IconField class="w-60">
        <InputIcon class="text-surface-500">
          <Search :size="16" />
        </InputIcon>
        <InputText
          :model-value="storeKeyword"
          placeholder="매장 검색"
          class="h-10 w-full"
          @update:model-value="emit('update:storeKeyword', String($event ?? ''))"
          @keydown.esc="emit('update:storeKeyword', '')"
        />
      </IconField>
    </div>

    <DataTable
      :value="cFiltered"
      :selection="selection"
      striped-rows
      data-key="orderSeq"
      :pt="{ thead: { class: 'bg-surface-50' } }"
      :row-class="(d: Transaction) => (d.payType == null ? 'bg-red-50!' : '')"
      @update:selection="emit('update:selection', $event as Transaction[])"
    >
      <Column selection-mode="multiple" :pt="{ headerCell: { style: 'width:3rem' } }" />
      <Column field="storeNm" header="매장" />
      <Column field="menuSummary" header="메뉴" />
      <Column field="orderAmount" header="주문금액">
        <template #body="{ data }">
          <span class="font-semibold">{{ data.orderAmount.toLocaleString() }}원</span>
        </template>
      </Column>
      <Column header="주문일자">
        <template #body="{ data }">
          <span class="text-sm text-surface-600">{{ fmtDate(data.orderAt) }}</span>
        </template>
      </Column>
      <!-- '모든 미수 보기' 모드일 때만 미수 누적 일수 노출 -->
      <Column v-if="showAllUnpaid" header="미수기간">
        <template #body="{ data }">
          <span class="text-sm text-surface-600">{{ daysAgo(data.orderAt) }}</span>
        </template>
      </Column>
      <Column header="결제방식">
        <template #body="{ data }">
          <PayTypeChip :pay-type="data.payType" />
        </template>
      </Column>

      <template #empty>
        <div class="py-8 text-center text-sm text-surface-500">{{ cEmptyLabel }}</div>
      </template>
    </DataTable>

    <!-- 액션 바 — 미수에는 결제, PAID 에는 결제 취소 -->
    <div
      class="sticky bottom-0 flex items-center justify-between rounded-lg border border-surface-200 bg-surface-0 px-4 py-3 shadow-sm"
    >
      <span class="text-sm text-surface-700">
        <span class="font-semibold text-surface-900">{{ selection.length }}건</span>
        선택
        <span class="ml-2 font-semibold text-surface-900">
          {{ cSelectedSum.toLocaleString() }}원
        </span>
        <span v-if="selection.length > 0" class="ml-2 text-xs text-surface-500">
          (미수 {{ cSelectedUnpaidCount }} · 완료 {{ cSelectedPaidCount }})
        </span>
      </span>

      <div class="flex items-center gap-2">
        <BButton
          v-tooltip="'선택 중 미수만 일괄 현금 결제'"
          color="primary"
          variant="outlined"
          :disabled="cSelectedUnpaidCount === 0"
          @click="emit('payAll', 'CASH')"
        >
          <Banknote :size="16" />
          현금
        </BButton>
        <BButton
          v-tooltip="'선택 중 미수만 일괄 카드 결제'"
          color="primary"
          variant="outlined"
          :disabled="cSelectedUnpaidCount === 0"
          @click="emit('payAll', 'CARD')"
        >
          <CreditCard :size="16" />
          카드
        </BButton>
        <BButton
          v-tooltip="'단일 미수 row 선택 시 분할 결제'"
          color="primary"
          :disabled="!cCanSplit"
          @click="onClickSplit"
        >
          <SplitSquareHorizontal :size="16" />
          분할 결제
        </BButton>
        <span class="mx-2 h-6 w-px bg-surface-200" />
        <BButton
          v-tooltip="'선택 중 결제완료만 일괄 취소 (PAID → COOKED)'"
          variant="outlined"
          color="danger"
          :disabled="cSelectedPaidCount === 0"
          @click="emit('cancelAll')"
        >
          <Undo2 :size="16" />
          결제 취소
        </BButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { vTooltip } from 'floating-vue'
import _ from 'lodash'
import { Banknote, CreditCard, Search, SplitSquareHorizontal, Undo2 } from 'lucide-vue-next'
import { computed } from 'vue'

import { useSearchFilter } from '@/composables/useSearchFilter'
import type { PayType } from '@/types/payment'
import type { Transaction } from '@/types/sales'

import PayTypeChip from './PayTypeChip.vue'

const props = defineProps<{
  /** 모드별 데이터 — 호출처(SettlementPage) 가 토글에 따라 적절한 list 전달. */
  rows: readonly Transaction[]
  /** 'YYYY-MM-DD' — 날짜 모드일 때 헤더 표시용. */
  date: string
  selection: Transaction[]
  storeKeyword: string
  showAllUnpaid: boolean
}>()

const emit = defineEmits<{
  'update:selection': [val: Transaction[]]
  'update:storeKeyword': [val: string]
  'update:showAllUnpaid': [val: boolean]
  /** [현금]/[카드] — 선택 중 미수만 일괄 결제. */
  payAll: [payType: PayType]
  /** [분할 결제] — 단일 미수 row 선택 시만 활성. */
  paySplit: [tx: Transaction]
  /** [결제 취소] — 선택 중 PAID 만 일괄 취소. */
  cancelAll: []
}>()

const { cFiltered } = useSearchFilter(
  () => props.rows,
  () => props.storeKeyword,
  (t) => t.storeNm,
)

const cHeaderLabel = computed(() => {
  const total = cFiltered.value.length
  const sum = _.sumBy(cFiltered.value, (t) => t.orderAmount).toLocaleString()
  if (props.showAllUnpaid) return `모든 미수 ${total}건 · 합계 ${sum}원`
  const [y, m, d] = props.date.split('-').map(Number) as [number, number, number]
  const lbl = format(new Date(y, m - 1, d), 'yyyy.MM.dd')
  return `${lbl} 거래 ${total}건 · 합계 ${sum}원`
})

const cEmptyLabel = computed(() =>
  props.showAllUnpaid ? '미수 내역이 없습니다.' : '해당 날짜의 거래가 없습니다.',
)

const cSelectedSum = computed(() => _.sumBy(props.selection, (t) => t.orderAmount))
const cSelectedUnpaidCount = computed(
  () => props.selection.filter((t) => t.payType == null).length,
)
const cSelectedPaidCount = computed(
  () => props.selection.filter((t) => t.payType != null).length,
)
const cCanSplit = computed(
  () => props.selection.length === 1 && props.selection[0]?.payType == null,
)

function fmtDate(s: string): string {
  return format(parseISO(s), 'yyyy.MM.dd')
}

function daysAgo(s: string): string {
  const days = differenceInCalendarDays(new Date(), parseISO(s))
  if (days <= 0) return '오늘'
  return `${days}일 전`
}

function onClickSplit() {
  const tx = props.selection[0]
  if (tx && tx.payType == null) emit('paySplit', tx)
}
</script>
