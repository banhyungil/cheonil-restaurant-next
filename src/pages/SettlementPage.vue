<!-- 정산 페이지 — [정산][수금] 두 탭 통합 -->
<template>
  <section class="settlement-page flex h-full flex-col gap-5 px-8 py-6">
    <SettlementHeader
      :tab="cTab"
      :date="date"
      :is-today="cIsToday"
      @update:tab="onChangeTab"
      @update:date="setDate"
      @prev="prev"
      @next="next"
      @today="today"
    />

    <!-- 정산 탭 -->
    <template v-if="cTab === 'settle'">
      <SalesSummaryCards :summary="summary" />
      <div class="min-h-0 flex-1 Poverflow-auto">
        <TransactionTable
          v-model:pay-filter="settleFilter"
          v-model:store-keyword="settleKeyword"
          :transactions="transactions?.content ?? []"
          @cancel-pay="onCancelPay"
        />
      </div>
    </template>

    <!-- 수금 탭 — 기본: 선택 날짜 거래 (paid + unpaid) / 토글 ON: 모든 미수 (날짜 무관) -->
    <template v-else>
      <div class="min-h-0 flex-1 overflow-auto">
        <CollectionTable
          v-model:selection="collectSelection"
          v-model:store-keyword="collectKeyword"
          v-model:show-all-unpaid="showAllUnpaid"
          :rows="cCollectionRows"
          :date="date"
          @pay-all="onPayAll"
          @pay-split="onPaySplit"
          @cancel-all="onCancelAll"
        />
      </div>
    </template>

    <SplitPaymentDialog
      v-model:visible="showSplitDialog"
      :tx="splitTarget"
      :loading="splitLoading"
      @submit="onSubmitSplit"
    />
  </section>
</template>

<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useDateNav } from '@/composables/useDateNav'
import {
  usePaymentBatchCreateMutation,
  usePaymentBatchDeleteMutation,
  usePaymentSplitMutation,
} from '@/queries/paymentsQuery'
import { useSalesSummaryQuery, useTransactionsQuery, useUnpaidQuery } from '@/queries/salesQuery'
import type { PayType } from '@/types/payment'
import type { Transaction } from '@/types/sales'

import type { SettlementTab } from '@/components/settlement/SettlementHeader.vue'
import type { TxPayFilter } from '@/components/settlement/TransactionTable.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

// --- tab (URL query 보존) ---
const cTab = computed<SettlementTab>(() => (route.query.tab === 'collect' ? 'collect' : 'settle'))
function onChangeTab(t: SettlementTab) {
  router.replace({ query: { ...route.query, tab: t } })
}

// --- date nav (정산 탭 전용) ---
const { date, cIsToday, prev, next, today, setDate } = useDateNav()

// --- 정산 탭 상태 ---
const settleFilter = ref<TxPayFilter>('ALL')
const settleKeyword = ref('')

const { data: summary } = useSalesSummaryQuery(date)
const { data: transactions } = useTransactionsQuery(
  computed(() => ({
    date: date.value,
    payType: settleFilter.value === 'ALL' ? undefined : settleFilter.value,
  })),
)

// --- 수금 탭 상태 ---
const collectSelection = ref<Transaction[]>([])
const collectKeyword = ref('')
/** true: 모든 미수 (날짜 무관) / false: 선택 날짜 거래 (paid + unpaid). */
const showAllUnpaid = ref(false)

const { data: unpaid } = useUnpaidQuery()

/** 수금 탭 데이터 — 토글에 따라 unpaid (모든 미수) 또는 transactions (선택 날짜 거래) */
const cCollectionRows = computed<readonly Transaction[]>(() =>
  showAllUnpaid.value ? (unpaid.value?.content ?? []) : (transactions.value?.content ?? []),
)

// --- mutation ---
const { mutate: payBatch, isPending: isBatchPending } = usePaymentBatchCreateMutation()
const { mutate: paySplit, isPending: isSplitPending } = usePaymentSplitMutation()
const { mutate: cancelByOrders } = usePaymentBatchDeleteMutation()

// --- 분할 결제 다이얼로그 ---
const showSplitDialog = ref(false)
const splitTarget = ref<Transaction | null>(null)
const splitLoading = computed(() => isSplitPending.value)

function onPayAll(payType: PayType) {
  // 선택 중 미수만 — PAID row 가 섞여 있어도 안전.
  const targets = collectSelection.value.filter((t) => t.payType == null)
  if (targets.length === 0) return
  const payloads = targets.map((t) => ({ orderSeq: t.orderSeq, payType }))
  payBatch(payloads, {
    onSuccess: () => {
      toast.add({
        severity: 'success',
        summary: `${payType === 'CASH' ? '현금' : '카드'} 결제 ${payloads.length}건`,
        life: 2500,
      })
      collectSelection.value = []
    },
  })
  // isBatchPending: 추후 버튼 loading 연결 가능
  void isBatchPending
}

function onCancelAll() {
  // 선택 중 PAID row 만 — 결제 취소 (PAID → COOKED).
  const targets = collectSelection.value.filter((t) => t.payType != null)
  if (targets.length === 0) return
  confirm.require({
    message: `선택한 ${targets.length}건의 결제를 취소하시겠습니까?`,
    header: '결제 일괄 취소',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      cancelByOrders(
        { orderSeqs: targets.map((t) => t.orderSeq) },
        {
          onSuccess: () => {
            toast.add({
              severity: 'success',
              summary: `결제 취소 ${targets.length}건`,
              life: 2500,
            })
            collectSelection.value = []
          },
        },
      )
    },
  })
}

function onPaySplit(tx: Transaction) {
  splitTarget.value = tx
  showSplitDialog.value = true
}

function onSubmitSplit(orderSeq: number, splits: { payType: PayType; amount: number }[]) {
  paySplit(
    { orderSeq, splits },
    {
      onSuccess: () => {
        toast.add({ severity: 'success', summary: '분할 결제 완료', life: 2500 })
        showSplitDialog.value = false
        splitTarget.value = null
        collectSelection.value = []
      },
    },
  )
}

function onCancelPay(orderSeq: number) {
  confirm.require({
    message: '해당 거래의 결제를 취소하시겠습니까? (PAID → COOKED)',
    header: '결제 취소',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      cancelByOrders(
        { orderSeqs: [orderSeq] },
        {
          onSuccess: () =>
            toast.add({ severity: 'success', summary: '결제 취소', life: 2500 }),
        },
      )
    },
  })
}
</script>
