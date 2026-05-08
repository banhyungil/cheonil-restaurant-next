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
            v-if="needsManualGenerate(data)"
            v-tooltip="'수동 생성 - 오늘 예약일자 기준 미생성 된 건'"
            variant="outlined"
            color="warn"
            size="sm"
            @click="emit('generate-rsv', data.seq)"
          >
            <PlayCircle :size="14" />
          </BButton>
          <BButton
            v-tooltip="'수정'"
            variant="outlined"
            color="secondary"
            size="sm"
            @click="emit('edit', data.seq)"
          >
            <SquarePen :size="14" />
          </BButton>
          <BButton
            v-tooltip="'삭제'"
            variant="outlined"
            color="danger"
            size="sm"
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
import { format, isToday, parseISO } from 'date-fns'
import { vTooltip } from 'floating-vue'
import { PlayCircle, SquarePen, Trash2 } from 'lucide-vue-next'

import type { DayType, OrderRsvTmplExt } from '@/types/orderRsv'

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

/** Date.getDay() 인덱스 → DayType. 일요일 = 0 부터 시작. */
const DAY_TYPE_BY_INDEX: DayType[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

defineProps<{
  tmpls: OrderRsvTmplExt[]
}>()

const emit = defineEmits<{
  edit: [seq: number]
  'toggle-active': [seq: number, active: boolean]
  'toggle-auto-order': [seq: number, autoOrder: boolean]
  'generate-rsv': [seq: number]
  remove: [seq: number]
}>()

/** 수동 생성 버튼 활성화 lead time — 서버는 1시간 전 자동 생성, 클라는 30분 전부터 fallback 노출. */
const MANUAL_GEN_LEAD_MIN = 30

/**
 * 수동 생성 버튼 표시 조건:
 *  1. active 한 템플릿
 *  2. 오늘이 dayTypes 에 포함
 *  3. 오늘이 [startDt, endDt] 기간 내
 *  4. 현재 시각이 (오늘 rsvTime - 30분) 이후 — 서버 자동 생성(1시간 전) 누락 대비 fallback
 *  5. lastRsvGenAt 이 오늘 아님 (스케줄러 누락)
 */
function needsManualGenerate(t: OrderRsvTmplExt): boolean {
  if (!t.active) return false

  const now = new Date()
  const todayDay = DAY_TYPE_BY_INDEX[now.getDay()]!
  if (!t.dayTypes.includes(todayDay)) return false

  const todayStr = format(now, 'yyyy-MM-dd')
  if (todayStr < t.startDt) return false
  if (t.endDt && todayStr > t.endDt) return false

  // 'HH:mm:ss' 의 오늘자 시각 vs 현재 — rsvTime 30분 전부터 활성화
  const [hh = 0, mm = 0, ss = 0] = t.rsvTime.split(':').map(Number)
  const rsvAt = new Date(now)
  rsvAt.setHours(hh, mm, ss, 0)
  const enableAt = new Date(rsvAt.getTime() - MANUAL_GEN_LEAD_MIN * 60_000)
  if (now < enableAt) return false

  if (t.lastRsvGenAt && isToday(parseISO(t.lastRsvGenAt))) return false

  return true
}
</script>
