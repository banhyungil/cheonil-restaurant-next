<!-- 분할 결제 다이얼로그 — 단일 주문에 대한 N개 결제 행 입력 -->
<template>
  <Dialog
    :visible="visible"
    modal
    :header="cHeader"
    :style="{ width: '480px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="tx" class="flex flex-col gap-4">
      <div class="rounded-lg bg-surface-50 px-3 py-2 text-sm">
        <div class="font-semibold text-surface-900">{{ tx.storeNm }}</div>
        <div class="text-surface-600">{{ tx.menuSummary }}</div>
        <div class="mt-1 font-semibold text-surface-900">
          주문금액 {{ tx.orderAmount.toLocaleString() }}원
        </div>
      </div>

      <!-- splits 입력 -->
      <div class="flex flex-col gap-2">
        <div
          v-for="(row, i) in splits"
          :key="i"
          class="flex items-center gap-2"
        >
          <Select
            v-model="row.payType"
            :options="PAY_OPTIONS"
            option-value="val"
            option-label="label"
            class="w-28"
          />
          <InputGroup>
            <InputNumber
              v-model="row.amount"
              :min="0"
              placeholder="금액"
              class="w-full"
              :input-class="'text-right'"
            />
            <InputGroupAddon>원</InputGroupAddon>
          </InputGroup>
          <BButton
            v-tooltip="'행 삭제'"
            variant="outlined"
            color="danger"
            size="sm"
            :disabled="splits.length <= 1"
            @click="onRemoveRow(i)"
          >
            <Trash2 :size="14" />
          </BButton>
        </div>
        <BButton variant="outlined" color="secondary" size="sm" class="self-start" @click="onAddRow">
          <Plus :size="14" />
          행 추가
        </BButton>
      </div>

      <!-- 합계 검증 -->
      <div class="flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2">
        <span class="text-sm text-surface-600">분할 합계</span>
        <div class="flex items-center gap-2">
          <span class="font-semibold" :class="cSumColor">
            {{ cSumOfSplits.toLocaleString() }}원
          </span>
          <span class="text-xs text-surface-500">
            / {{ tx.orderAmount.toLocaleString() }}원
          </span>
        </div>
      </div>

      <BInfoBanner v-if="!cIsValid" severity="warn">
        분할 합계가 주문금액과 일치해야 결제할 수 있습니다.
      </BInfoBanner>
    </div>

    <template #footer>
      <BButton variant="outlined" color="secondary" @click="emit('update:visible', false)">
        취소
      </BButton>
      <BButton color="primary" :disabled="!cIsValid" :loading="loading" @click="onSubmit">
        결제 완료
      </BButton>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { vTooltip } from 'floating-vue'
import _ from 'lodash'
import { Plus, Trash2 } from 'lucide-vue-next'
import { computed, reactive, watch } from 'vue'

import type { PaymentSplit } from '@/apis/paymentsApi'
import type { Transaction } from '@/types/sales'

const PAY_OPTIONS = [
  { val: 'CASH' as const, label: '현금' },
  { val: 'CARD' as const, label: '카드' },
]

const props = defineProps<{
  visible: boolean
  /** null 이면 비활성 — 일반적으로 단일 row 선택 시 전달. */
  tx: Transaction | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  submit: [orderSeq: number, splits: PaymentSplit[]]
}>()

const splits = reactive<PaymentSplit[]>([{ payType: 'CASH', amount: 0 }])

// 다이얼로그 열릴 때마다 초기화 — 첫 행은 주문금액 default 로 prefill
watch(
  () => [props.visible, props.tx?.orderSeq],
  ([visible]) => {
    if (visible && props.tx) {
      splits.splice(0, splits.length, { payType: 'CASH', amount: props.tx.orderAmount })
    }
  },
  { immediate: true },
)

const cHeader = computed(() => `분할 결제 — 주문 #${props.tx?.orderSeq ?? ''}`)

const cSumOfSplits = computed(() => _.sumBy(splits, (s) => s.amount ?? 0))

const cIsValid = computed(
  () =>
    !!props.tx &&
    splits.every((s) => s.amount > 0) &&
    cSumOfSplits.value === props.tx.orderAmount,
)

const cSumColor = computed(() => {
  if (!props.tx) return 'text-surface-900'
  if (cSumOfSplits.value === props.tx.orderAmount) return 'text-emerald-600'
  return 'text-red-600'
})

function onAddRow() {
  splits.push({ payType: 'CASH', amount: 0 })
}

function onRemoveRow(i: number) {
  splits.splice(i, 1)
}

function onSubmit() {
  if (!props.tx || !cIsValid.value) return
  emit('submit', props.tx.orderSeq, splits.map((s) => ({ ...s })))
}
</script>
