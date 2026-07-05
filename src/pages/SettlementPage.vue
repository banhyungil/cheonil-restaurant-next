<!-- 정산 페이지 — [정산][수금] 두 탭 통합 -->
<template>
  <section class="settlement-page flex h-full flex-col gap-5 px-8 py-6">
    <SettlementHeader :tab="cTab" @update:tab="onChangeTab" />

    <TransactionTab v-show="cTab === 'settle'" />

    <CollectionTab
      v-show="cTab === 'collect'"
      :rows="cCollectionRows"
      v-model:selRows="collectionSelRows"
      v-model:show-all-unpaid="showAllUnpaid"
      v-model:collect-at="collectAt"
      v-model:from="collectFrom"
      v-model:to="collectTo"
      @pay-all="onPayAll"
      @pay-split="onPaySplit"
      @cancel-all="onCancelAll"
      class="min-h-0 flex-1 overflow-auto"
    />

    <SplitPaymentDialog
      v-model:visible="showSplitDialog"
      :tx="splitTarget"
      :loading="splitLoading"
      @submit="onSubmitSplit"
    />
  </section>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  usePaymentBatchCreateMutation,
  usePaymentBatchDeleteMutation,
  usePaymentSplitMutation,
} from '@/queries/paymentsQuery'
import { useTransactionsQuery, useUnpaidQuery } from '@/queries/salesQuery'
import type { PayType } from '@/types/payment'
import type { Transaction } from '@/types/sales'

import TransactionTab from '@/components/settlement/TransactionTab.vue'

import type { SettlementTab } from '@/components/settlement/SettlementHeader.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

// --- tab (URL query 보존) ---
const cTab = computed<SettlementTab>(() => (route.query.tab === 'collect' ? 'collect' : 'settle'))
function onChangeTab(t: SettlementTab) {
  router.replace({ query: { ...route.query, tab: t } })
}

// 정산 탭 데이터/날짜 네비는 TransactionTab 내부로 이동 (탭 자기완결형).

// --- 수금 탭 상태 ---
/** 선택된 수금 목록 */
const collectionSelRows = shallowRef<Transaction[]>([])
/** true: 모든 미수 (날짜 무관) / false: 범위(from~to) 거래 (paid + unpaid). */
const showAllUnpaid = ref(false)
/** 수금 처리 일시 — 기본 현재. 나중에 몰아서 입력 시 과거 일시 선택 가능. */
const collectAt = ref(new Date())
/** 수금 탭 조회 범위 — 정산 탭 날짜 네비와 독립. 기본 오늘 하루. */
const todayStr = format(new Date(), 'yyyy-MM-dd')
const collectFrom = ref(todayStr)
const collectTo = ref(todayStr)

const { data: unpaid } = useUnpaidQuery()
// 수금 탭 전용 range 쿼리 — 정산 탭 transactions 와 별개 인스턴스.
const { data: collectTx } = useTransactionsQuery(
  computed(() => ({ from: collectFrom.value, to: collectTo.value })),
)

/** 수금 탭 데이터 — 토글에 따라 unpaid (모든 미수) 또는 collectTx (범위 거래) */
const cCollectionRows = computed<readonly Transaction[]>(() =>
  showAllUnpaid.value ? (unpaid.value?.content ?? []) : (collectTx.value ?? []),
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
  const targets = collectionSelRows.value.filter((t) => t.payments.length === 0)
  if (targets.length === 0) return
  const payAt = collectAt.value.toISOString()
  const payloads = targets.map((t) => ({ orderSeq: t.orderSeq, payType, payAt }))
  payBatch(payloads, {
    onSuccess: () => {
      toast.add({
        severity: 'success',
        summary: `${payType === 'CASH' ? '현금' : '카드'} 결제 ${payloads.length}건`,
        life: 2500,
      })
      collectionSelRows.value = []
    },
  })
  // isBatchPending: 추후 버튼 loading 연결 가능
  void isBatchPending
}

function onCancelAll() {
  // 선택 중 PAID row 만 — 결제 취소 (PAID → COOKED).
  const targets = collectionSelRows.value.filter((t) => t.payments.length > 0)
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
            collectionSelRows.value = []
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
    { orderSeq, splits, payAt: collectAt.value.toISOString() },
    {
      onSuccess: () => {
        toast.add({ severity: 'success', summary: '분할 결제 완료', life: 2500 })
        showSplitDialog.value = false
        splitTarget.value = null
        collectionSelRows.value = []
      },
    },
  )
}
</script>
