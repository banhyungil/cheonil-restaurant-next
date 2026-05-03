<!-- 예약 템플릿 목록 테이블 -->
<template>
  <DataTable
    class="order-rsv-tmpl-table"
    :value="tmpls"
    striped-rows
    data-key="seq"
    :pt="{ thead: { class: 'bg-surface-50' } }"
  >
    <Column field="nm" header="템플릿명">
      <template #body="{ data }">
        <div class="font-semibold text-surface-900">{{ data.nm }}</div>
        <div class="text-xs text-surface-500">반복 예약</div>
      </template>
    </Column>

    <Column field="storeNm" header="매장" />

    <Column header="요일">
      <template #body="{ data }">
        <div class="flex gap-1">
          <span
            v-for="day in DAY_TYPES"
            :key="day"
            :class="[
              'flex size-6 items-center justify-center rounded text-xs',
              data.dayTypes.includes(day)
                ? 'bg-primary-100 text-primary-700'
                : 'bg-surface-50 text-surface-400',
            ]"
          >
            {{ DAY_LABEL[day] }}
          </span>
        </div>
      </template>
    </Column>

    <Column field="rsvTime" header="시작">
      <template #body="{ data }">
        {{ data.rsvTime.slice(0, 5) }}
      </template>
    </Column>

    <Column header="메뉴 요약">
      <template #body="{ data }">
        <span class="text-sm text-surface-700">
          {{
            data.menus
              .map((m: { menuNm: string; cnt: number }) => `${m.menuNm} ${m.cnt}`)
              .join(', ')
          }}
        </span>
      </template>
    </Column>

    <Column field="amount" header="금액">
      <template #body="{ data }">
        <span class="font-semibold">{{ data.amount.toLocaleString() }}원</span>
      </template>
    </Column>

    <Column header="기간">
      <template #body="{ data }">
        <div class="text-sm">{{ data.startDt }}</div>
        <div class="text-xs text-surface-500">~ {{ data.endDt ?? '무기한' }}</div>
      </template>
    </Column>

    <Column header="활성">
      <template #body="{ data }">
        <ToggleSwitch
          :model-value="data.active"
          @update:model-value="(v: boolean) => emit('toggle-active', data.seq, v)"
        />
      </template>
    </Column>

    <Column header="자동 주문">
      <template #body="{ data }">
        <ToggleSwitch
          v-tooltip="'예약 시각이 되면 주문을 자동 생성합니다'"
          :model-value="data.autoOrder"
          @update:model-value="(v: boolean) => emit('toggle-auto-order', data.seq, v)"
        />
      </template>
    </Column>

    <Column header="">
      <template #body="{ data }">
        <div class="flex gap-1">
          <BButton
            variant="outlined"
            color="secondary"
            size="sm"
            @click="emit('edit', data.seq)"
            v-tooltip="'수정'"
          >
            <SquarePen :size="14" />
          </BButton>
          <BButton
            variant="outlined"
            color="danger"
            size="sm"
            v-tooltip="'삭제'"
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
import { SquarePen, Trash2 } from 'lucide-vue-next'

import type { DayType, OrderRsvTmplExt } from '@/types/orderRsv'
import { vTooltip } from 'floating-vue'

const DAY_TYPES: DayType[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const DAY_LABEL: Record<DayType, string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
}

defineProps<{
  tmpls: OrderRsvTmplExt[]
}>()

const emit = defineEmits<{
  edit: [seq: number]
  'toggle-active': [seq: number, active: boolean]
  'toggle-auto-order': [seq: number, autoOrder: boolean]
  remove: [seq: number]
}>()
</script>
