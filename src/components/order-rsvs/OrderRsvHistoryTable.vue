<!-- 예약 처리 이력 테이블 (COMPLETED/CANCELED) — 복구/삭제 액션은 modAt 기준 1시간 윈도우 내에서만 가능 -->
<template>
  <DataTable
    class="order-rsv-history-table"
    :value="rsvs"
    striped-rows
    data-key="seq"
    paginator
    :rows="20"
    :rows-per-page-options="[10, 20, 50, 100]"
    :pt="{ thead: { class: 'bg-surface-50' } }"
  >
    <Column header="예약시각">
      <template #body="{ data }">
        <span class="text-sm">{{ format(new Date(data.rsvAt), 'yyyy-MM-dd HH:mm') }}</span>
      </template>
    </Column>

    <Column field="storeNm" header="매장">
      <template #body="{ data }">
        <span class="font-semibold text-surface-900">{{ data.storeNm }}</span>
      </template>
    </Column>

    <Column header="출처">
      <template #body="{ data }">
        <span class="rounded bg-surface-100 px-2 py-0.5 text-xs">
          #{{ data.tmplNm ?? '일회성' }}
        </span>
      </template>
    </Column>

    <Column header="메뉴">
      <template #body="{ data }">
        <span class="text-sm text-surface-700">
          {{ data.menus.map((m: OrderRsvMenuExt) => `${m.menuNm} ${m.cnt}`).join(', ') }}
        </span>
      </template>
    </Column>

    <Column field="amount" header="금액">
      <template #body="{ data }">
        <span class="font-semibold tabular-nums">{{ data.amount.toLocaleString() }}원</span>
      </template>
    </Column>

    <Column header="상태">
      <template #body="{ data }">
        <span
          class="rounded px-2 py-0.5 text-xs"
          :class="
            data.status === 'COMPLETED'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          "
        >
          {{ data.status === 'COMPLETED' ? '✓ 접수' : '✕ 취소' }}
        </span>
      </template>
    </Column>

    <Column header="처리시각">
      <template #body="{ data }">
        <span class="text-sm text-surface-600">
          {{ format(new Date(data.modAt), 'yyyy-MM-dd HH:mm') }}
        </span>
      </template>
    </Column>

    <Column header="">
      <template #body="{ data }">
        <div class="flex gap-1">
          <BButton
            v-tooltip="hasOrder(data) ? '복구 불가 (주문 생성됨)' : '복구'"
            variant="outlined"
            color="secondary"
            size="sm"
            :disabled="hasOrder(data)"
            @click="emit('restore', data.seq)"
          >
            <RotateCcw :size="14" />
          </BButton>
          <BButton
            v-tooltip="hasOrder(data) ? '삭제 불가 (주문 생성됨)' : '삭제'"
            variant="outlined"
            color="danger"
            size="sm"
            :disabled="hasOrder(data)"
            @click="emit('remove', data.seq)"
          >
            <Trash2 :size="14" />
          </BButton>
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { vTooltip } from 'floating-vue'
import { RotateCcw, Trash2 } from 'lucide-vue-next'

import type { OrderRsvExt, OrderRsvMenuExt } from '@/types/orderRsv'

defineProps<{
  rsvs: OrderRsvExt[]
}>()

const emit = defineEmits<{
  restore: [seq: number]
  remove: [seq: number]
}>()

/** 연결된 주문이 살아있는지 — 있으면 복구/삭제 불가 (시간 무관). */
function hasOrder(rsv: OrderRsvExt) {
  return rsv.orderSeq != null
}
</script>
