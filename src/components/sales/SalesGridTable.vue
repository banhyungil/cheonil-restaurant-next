<!-- 주문내역관리 그리드 테이블 — 클라 페이징/정렬, 다중 선택 후 sticky 삭제 바 -->
<template>
  <div class="sales-grid-table flex flex-col gap-3">
    <DataTable
      :value="rows"
      :selection="selection"
      striped-rows
      data-key="orderSeq"
      paginator
      :rows="pageSize"
      :rows-per-page-options="[10, 20, 50]"
      sort-mode="single"
      :default-sort-order="-1"
      :pt="{ thead: { class: 'bg-surface-50' } }"
      :row-class="(d: OrderRow) => (d.payType == null ? 'bg-red-50!' : '')"
      @update:selection="emit('update:selection', $event as OrderRow[])"
    >
      <Column selection-mode="multiple" :pt="{ headerCell: { style: 'width:3rem' } }" />
      <Column header="#" :pt="{ headerCell: { style: 'width:3rem' } }">
        <template #body="{ index }">
          <span class="text-sm text-surface-500">{{ index + 1 }}</span>
        </template>
      </Column>
      <Column field="storeNm" header="매장" sortable />
      <Column field="menuSummary" header="메뉴" />
      <Column field="orderAmount" header="주문금액" sortable>
        <template #body="{ data }">
          <span class="font-semibold">{{ data.orderAmount.toLocaleString() }}원</span>
        </template>
      </Column>
      <Column field="orderAt" header="주문일시" sortable>
        <template #body="{ data }">
          <span class="text-sm text-surface-600">{{ fmtDateTime(data.orderAt) }}</span>
        </template>
      </Column>
      <Column header="결제방식">
        <template #body="{ data }">
          <PayTypeChip :pay-type="data.payType" />
        </template>
      </Column>
      <Column header="결제날짜">
        <template #body="{ data }">
          <span class="text-sm text-surface-600">{{ fmtDate(data.payAt) }}</span>
        </template>
      </Column>
      <Column field="payAmount" header="결제금액" sortable>
        <template #body="{ data }">
          <span class="font-semibold">{{ data.payAmount.toLocaleString() }}원</span>
        </template>
      </Column>
      <Column header="상태">
        <template #body="{ data }">
          <StatusChip :status="data.status" />
        </template>
      </Column>
      <Column field="cmt" header="비고">
        <template #body="{ data }">
          <span class="text-sm text-surface-700">{{ data.cmt ?? '-' }}</span>
        </template>
      </Column>

      <template #empty>
        <div class="py-8 text-center text-sm text-surface-500">조회 결과가 없습니다.</div>
      </template>
    </DataTable>

    <!-- 선택 시 sticky 액션 바 -->
    <Transition name="fade">
      <div
        v-if="selection.length > 0"
        class="sticky bottom-0 flex items-center justify-between rounded-lg border border-surface-200 bg-surface-0 px-4 py-3 shadow-sm"
      >
        <span class="text-sm text-surface-700">
          <span class="font-semibold text-emerald-600">{{ selection.length }}건</span>
          선택
          <span class="ml-2 font-semibold text-surface-900">
            {{ cSelectedSum.toLocaleString() }}원
          </span>
        </span>

        <BButton variant="outlined" color="danger" @click="emit('remove')">
          <Trash2 :size="16" />
          삭제
        </BButton>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import _ from 'lodash'
import { Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

import type { OrderRow } from '@/types/sales'

import PayTypeChip from '@/components/settlement/PayTypeChip.vue'

import StatusChip from './StatusChip.vue'

const props = withDefaults(
  defineProps<{
    rows: readonly OrderRow[]
    selection: OrderRow[]
    pageSize?: number
  }>(),
  { pageSize: 10 },
)

const emit = defineEmits<{
  'update:selection': [val: OrderRow[]]
  remove: []
}>()

const cSelectedSum = computed(() => _.sumBy(props.selection, (r) => r.orderAmount))

function fmtDateTime(s: string): string {
  return format(parseISO(s), 'MM/dd HH:mm')
}
function fmtDate(s: string | null): string {
  if (!s) return '-'
  return format(parseISO(s), 'MM/dd')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
