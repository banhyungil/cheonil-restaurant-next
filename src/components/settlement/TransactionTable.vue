<!-- 정산 탭 거래 내역 테이블 (read-only + PAID 결제 취소) -->
<template>
  <div class="transaction-table flex flex-col gap-3">
    <!-- 필터 chip + 매장 검색 -->
    <div class="flex items-center gap-3">
      <BTabs
        :model-value="payFilter"
        :options="cFilterOptions"
        variant="outline"
        @update:model-value="emit('update:payFilter', $event)"
      />
      <div class="flex-1" />
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
      striped-rows
      data-key="orderSeq"
      :pt="{ thead: { class: 'bg-surface-50' } }"
      :row-class="(d: Transaction) => (d.payType == null ? 'bg-red-50!' : '')"
    >
      <Column field="storeNm" header="매장" />
      <Column field="menuSummary" header="메뉴" />
      <Column field="orderAmount" header="주문금액">
        <template #body="{ data }">
          <span class="font-semibold">{{ data.orderAmount.toLocaleString() }}원</span>
        </template>
      </Column>
      <Column header="주문시간">
        <template #body="{ data }">
          <span class="text-sm text-surface-600">{{ fmtTime(data.orderAt) }}</span>
        </template>
      </Column>
      <Column header="완료시간">
        <template #body="{ data }">
          <span class="text-sm text-surface-600">{{ fmtTime(data.cookedAt) }}</span>
        </template>
      </Column>
      <Column header="결제방식">
        <template #body="{ data }">
          <PayTypeChip :pay-type="data.payType" />
        </template>
      </Column>
      <Column header="결제시간">
        <template #body="{ data }">
          <span class="text-sm text-surface-600">{{ fmtTime(data.payAt) }}</span>
        </template>
      </Column>
      <Column field="payAmount" header="결제금액">
        <template #body="{ data }">
          <span class="font-semibold">{{ data.payAmount.toLocaleString() }}원</span>
        </template>
      </Column>
      <Column header="작업">
        <template #body="{ data }">
          <BButton
            v-if="data.payType != null"
            v-tooltip="'결제 취소'"
            variant="outlined"
            color="danger"
            size="sm"
            @click="emit('cancelPay', data.orderSeq)"
          >
            <Undo2 :size="14" />
          </BButton>
        </template>
      </Column>

      <template #empty>
        <div class="py-8 text-center text-sm text-surface-500">거래 내역이 없습니다.</div>
      </template>

      <template #footer>
        <div class="flex items-center justify-between text-sm">
          <span class="text-surface-600">
            수금 완료 {{ cPaidCount }}건 · 미수 {{ cUnpaidCount }}건
          </span>
          <span class="font-semibold text-surface-900">
            합계 {{ cTotalSum.toLocaleString() }}원
          </span>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { vTooltip } from 'floating-vue'
import _ from 'lodash'
import { Search, Undo2 } from 'lucide-vue-next'
import { computed } from 'vue'

import { useSearchFilter } from '@/composables/useSearchFilter'
import type { PayType } from '@/types/payment'
import type { Transaction } from '@/types/sales'

import PayTypeChip from './PayTypeChip.vue'

export type TxPayFilter = 'ALL' | PayType | 'UNPAID'

const props = defineProps<{
  transactions: readonly Transaction[]
  payFilter: TxPayFilter
  storeKeyword: string
}>()

const emit = defineEmits<{
  'update:payFilter': [val: TxPayFilter]
  'update:storeKeyword': [val: string]
  cancelPay: [orderSeq: number]
}>()

/** payType 별 카운트 (필터 칩 N 표시용). */
const cCounts = computed(() => {
  const all = props.transactions
  return {
    ALL: all.length,
    CASH: all.filter((t) => t.payType === 'CASH').length,
    CARD: all.filter((t) => t.payType === 'CARD').length,
    UNPAID: all.filter((t) => t.payType == null).length,
  }
})

const cFilterOptions = computed(() => [
  { val: 'ALL' as const, label: `전체 ${cCounts.value.ALL}` },
  { val: 'CASH' as const, label: `현금 ${cCounts.value.CASH}` },
  { val: 'CARD' as const, label: `카드 ${cCounts.value.CARD}` },
  { val: 'UNPAID' as const, label: `미수 ${cCounts.value.UNPAID}` },
])

const cByPayType = computed(() => {
  const f = props.payFilter
  if (f === 'ALL') return props.transactions
  if (f === 'UNPAID') return props.transactions.filter((t) => t.payType == null)
  return props.transactions.filter((t) => t.payType === f)
})

// 매장명 자모/초성 검색
const { cFiltered } = useSearchFilter(cByPayType, () => props.storeKeyword, (t) => t.storeNm)

const cPaidCount = computed(() => cFiltered.value.filter((t) => t.payType != null).length)
const cUnpaidCount = computed(() => cFiltered.value.filter((t) => t.payType == null).length)
const cTotalSum = computed(() => _.sumBy(cFiltered.value, (t) => t.orderAmount))

function fmtTime(s: string | null): string {
  if (!s) return '-'
  return format(parseISO(s), 'HH:mm')
}
</script>
