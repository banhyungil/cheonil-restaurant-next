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
        <ToggleSwitch :model-value="showAllUnpaid" />
      </label>

      <IconField class="w-60">
        <InputIcon class="text-surface-500">
          <Search :size="16" />
        </InputIcon>
        <InputText
          :model-value="storeKeyword"
          placeholder="매장 검색"
          class="h-10 w-full"
          @keydown.esc="() => (storeKeyword = '')"
        />
      </IconField>
    </div>

    <!-- :selection="selRows"
    @update:selection="() => console.log('update')" -->
    <DataTable
      :value="cFiltered"
      v-model:selection="selRows"
      striped-rows
      data-key="orderSeq"
      :pt="{ thead: { class: 'bg-surface-50' } }"
      :row-class="(d: Transaction) => (d.payments.length === 0 ? 'bg-red-50!' : '')"
    >
      <Column selection-mode="multiple" :pt="{ headerCell: { style: 'width:3rem' } }" />
      <Column
        header="#"
        :pt="{
          headerCell: { style: 'width:3rem' },
          bodyCell: { class: 'text-center text-sm text-surface-500' },
        }"
      >
        <template #body="{ index }">{{ index + 1 }}</template>
      </Column>
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
          <PayTypeChip :payments="data.payments" />
        </template>
      </Column>
      <Column header="결제금액">
        <template #body="{ data }">
          <span v-if="data.payments.length" class="font-semibold">
            {{ payAmountSum(data.payments).toLocaleString() }}원
          </span>
          <span v-else class="text-surface-400">-</span>
        </template>
      </Column>
      <Column header="결제일시">
        <template #body="{ data }">
          <span class="text-sm text-surface-600">{{ fmtDateTime(lastPayAt(data.payments)) }}</span>
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
        <span class="font-semibold text-surface-900">{{ selRows.length }}건</span>
        선택
        <span class="ml-2 font-semibold text-surface-900">
          {{ cSelectedSum.toLocaleString() }}원
        </span>
        <span v-if="selRows.length > 0" class="ml-2 text-xs text-surface-500">
          (미수 {{ cSelectedUnpaidCount }} · 완료 {{ cSelectedPaidCount }})
        </span>
      </span>

      <div class="flex items-center gap-2">
        <label class="flex items-center gap-2 text-sm text-surface-600">
          수금일시
          <DatePicker
            :model-value="collectAt"
            show-time
            hour-format="24"
            date-format="yy.mm.dd"
            show-icon
            manual-input
            class="w-56"
            @input="onCollectAtInput"
          />
        </label>
        <span class="mx-1 h-6 w-px bg-surface-200" />
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
import { differenceInCalendarDays, format, isValid, parse, parseISO } from 'date-fns'
import { vTooltip } from 'floating-vue'
import _ from 'lodash'
import { Banknote, CreditCard, Search, SplitSquareHorizontal, Undo2 } from 'lucide-vue-next'
import { computed } from 'vue'

import { payAmountSum } from '@/apis/paymentsApi'
import { useSearchFilter } from '@/composables/useSearchFilter'
import type { PayType } from '@/types/payment'
import type { PaymentEntry, Transaction } from '@/types/sales'

import PayTypeChip from './PayTypeChip.vue'

import DatePicker from 'primevue/datepicker'

const props = defineProps<{
  /** 모드별 데이터 — 호출처(SettlementPage) 가 토글에 따라 적절한 list 전달. */
  rows: readonly Transaction[]
  /** 'YYYY-MM-DD' — 날짜 모드일 때 헤더 표시용. */
  date: string
  // selection: Transaction[]
  // storeKeyword: string
  // showAllUnpaid: boolean
  /** 수금 처리 일시 — 일괄/분할 결제에 공통 적용. SettlementPage 소유. */
  // collectAt: Date
}>()

const selRows = defineModel<Transaction[]>('selRows', { default: [] })
const storeKeyword = ref<string>('')
const showAllUnpaid = defineModel<boolean>('showAllUnpaid', { default: false })
const collectAt = defineModel<Date>('collectAt', { default: new Date() })

const emit = defineEmits<{
  // 'update:storeKeyword': [val: string]
  // 'update:showAllUnpaid': [val: boolean]
  // 'update:collectAt': [val: Date]
  /** [현금]/[카드] — 선택 중 미수만 일괄 결제. */
  payAll: [payType: PayType]
  /** [분할 결제] — 단일 미수 row 선택 시만 활성. */
  paySplit: [tx: Transaction]
  /** [결제 취소] — 선택 중 PAID 만 일괄 취소. */
  cancelAll: []
}>()

// show-time + 24h 수동입력 PrimeVue 버그(blur 원복) 우회 — 직접 파싱해 커밋.
// 2자리수 입력시 한자리만 입력해도 2자리로 파싱되므로 정규식으로 자리수 까지 체크
// * 예) 2026.03.1 -> 2026.03.01 로 파싱되어 두자리 입력이 힘들어짐.
// * 자리수 까지 체크하면 이런 문제는 없어짐
const COLLECT_RE = /^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/
const onCollectAtInput = _.debounce((e: Event) => {
  const value = (e.target as HTMLInputElement | null)?.value?.trim()
  if (!value || !COLLECT_RE.test(value)) return

  const d = parse(value, 'yyyy.MM.dd HH:mm', new Date())
  if (isValid(d)) collectAt.value = d
}, 200)

const { cFiltered } = useSearchFilter(
  () => props.rows,
  () => storeKeyword.value,
  (t) => t.storeNm,
)

const cHeaderLabel = computed(() => {
  const total = cFiltered.value.length
  const sum = _.sumBy(cFiltered.value, (t) => t.orderAmount).toLocaleString()
  if (showAllUnpaid.value) return `모든 미수 ${total}건 · 합계 ${sum}원`
  const [y, m, d] = props.date.split('-').map(Number) as [number, number, number]
  const lbl = format(new Date(y, m - 1, d), 'yyyy.MM.dd')
  return `${lbl} 거래 ${total}건 · 합계 ${sum}원`
})

const cEmptyLabel = computed(() =>
  showAllUnpaid.value ? '미수 내역이 없습니다.' : '해당 날짜의 거래가 없습니다.',
)

const cSelectedSum = computed(() => _.sumBy(selRows.value, (t) => t.orderAmount))
const cSelectedUnpaidCount = computed(
  () => selRows.value.filter((t) => t.payments.length === 0).length,
)
const cSelectedPaidCount = computed(() => selRows.value.filter((t) => t.payments.length > 0).length)
const cCanSplit = computed(
  () => selRows.value.length === 1 && selRows.value[0]?.payments.length === 0,
)

function fmtDate(s: string): string {
  return format(parseISO(s), 'yyyy.MM.dd')
}

function lastPayAt(payments: readonly PaymentEntry[]): string | null {
  if (payments.length === 0) return null
  return _.maxBy([...payments], 'payAt')?.payAt ?? null
}

function fmtDateTime(s: string | null): string {
  if (!s) return '-'
  return format(parseISO(s), 'MM.dd HH:mm')
}

function daysAgo(s: string): string {
  const days = differenceInCalendarDays(new Date(), parseISO(s))
  if (days <= 0) return '오늘'
  return `${days}일 전`
}

function onClickSplit() {
  const tx = selRows.value[0]
  if (tx && tx.payments.length === 0) emit('paySplit', tx)
}
</script>
