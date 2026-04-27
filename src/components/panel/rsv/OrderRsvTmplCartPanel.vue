<template>
  <aside
    class="order-rsv-tmpl-cart-panel flex h-full w-130 shrink-0 flex-col gap-4 rounded-xl border border-surface-200 bg-surface-0 p-6"
  >
    <!-- 매장 헤더 -->
    <StoreSelectHeader
      :store-name="store?.nm ?? null"
      @change-store="emit('change-store')"
      @reset="emit('reset')"
    />

    <div class="h-px w-full bg-surface-200" />

    <!-- 매장 미선택 안내 -->
    <CartEmptyState
      v-if="cState === 'no-store'"
      icon="🏪"
      title="매장을 선택해 템플릿을 시작하세요"
      description="좌측에서 단골 매장을 클릭하세요"
    />

    <template v-else>
      <!-- 템플릿 메타 -->
      <div class="flex flex-col gap-3">
        <!-- 템플릿명 -->
        <div class="flex flex-col gap-1.5">
          <label for="tmpl-nm" class="text-sm font-semibold text-surface-900">
            📝 템플릿명 <span class="text-red-500">*</span>
          </label>
          <InputText
            id="tmpl-nm"
            :model-value="nm"
            placeholder="세림정식, 보승아침 등"
            @update:model-value="(v) => emit('update:nm', String(v ?? ''))"
          />
        </div>

        <!-- 반복 요일 -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-surface-900">
            📅 반복 요일 <span class="text-red-500">*</span>
          </label>
          <DayTypeSelector
            :model-value="dayTypes"
            @update:model-value="(v: DayType[]) => emit('update:dayTypes', v)"
          />
        </div>

        <!-- 예약 시각 + 시작일 -->
        <div class="flex gap-3">
          <div class="flex flex-1 flex-col gap-1.5">
            <label class="text-sm font-semibold text-surface-900">
              🕐 예약 시각 <span class="text-red-500">*</span>
            </label>
            <DatePicker
              :model-value="cRsvTime"
              time-only
              hour-format="24"
              show-icon
              icon-display="input"
              @update:model-value="onUpdateRsvTime"
            />
          </div>
          <div class="flex flex-1 flex-col gap-1.5">
            <label class="text-sm font-semibold text-surface-900">
              📆 시작일 <span class="text-red-500">*</span>
            </label>
            <DatePicker
              :model-value="cStartDt"
              date-format="yy-mm-dd"
              show-icon
              @update:model-value="onUpdateStartDt"
            />
          </div>
        </div>

        <!-- 종료일 / 무기한 -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-surface-900">📆 종료일</label>
          <div class="flex items-center gap-2">
            <DatePicker
              :model-value="cEndDt"
              :disabled="cIsEndless"
              date-format="yy-mm-dd"
              show-icon
              class="flex-1"
              @update:model-value="onUpdateEndDt"
            />
            <label class="flex items-center gap-1.5 text-sm">
              <Checkbox :model-value="cIsEndless" binary @update:model-value="onToggleEndless" />
              무기한
            </label>
          </div>
        </div>

        <!-- active 토글 -->
        <div class="flex items-center justify-between">
          <label class="text-sm font-semibold text-surface-900">활성</label>
          <ToggleSwitch
            :model-value="active"
            @update:model-value="(v: boolean) => emit('update:active', v)"
          />
        </div>
      </div>

      <div class="h-px w-full bg-surface-200" />

      <!-- 담긴 메뉴 -->
      <div class="flex flex-1 flex-col gap-1.5 overflow-auto">
        <label class="text-sm font-semibold text-surface-900">🧾 담긴 메뉴</label>
        <CartEmptyState
          v-if="cState === 'no-menu'"
          icon="🍽"
          title="메뉴를 담아주세요"
          description="좌측 메뉴를 클릭하면 카트에 담깁니다"
        />
        <div v-else class="flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
          <CartItemRow
            v-for="item in items"
            :key="item.menuSeq"
            :item="item"
            @increment="(seq: number) => emit('increment', seq)"
            @decrement="(seq: number) => emit('decrement', seq)"
            @update-cnt="(seq: number, cnt: number) => emit('update-cnt', seq, cnt)"
          />
        </div>
      </div>

      <!-- 비고 -->
      <div class="flex flex-col gap-1.5">
        <label for="tmpl-cmt" class="text-sm font-semibold text-surface-900">비고</label>
        <Textarea
          id="tmpl-cmt"
          :model-value="cmt"
          rows="2"
          placeholder="요청사항…"
          class="resize-none text-sm"
          @update:model-value="(v) => emit('update:cmt', String(v ?? ''))"
        />
      </div>
    </template>

    <!-- 합계 -->
    <CartSummary :total-count="cTotalCount" :total-amount="cTotalAmount" />

    <!-- CTA -->
    <div class="flex gap-2">
      <BButton variant="outlined" color="secondary" class="h-12! flex-1!" @click="emit('cancel')">
        취소
      </BButton>
      <BButton color="primary" class="h-12! flex-2!" :disabled="!cCanSave" @click="emit('save')">
        💾 {{ isEditing ? '수정 완료' : '템플릿 등록' }}
      </BButton>
    </div>
  </aside>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { computed } from 'vue'

import DayTypeSelector from '@/components/order-rsvs/DayTypeSelector.vue'
import CartEmptyState from '@/components/panel/order-cart/CartEmptyState.vue'
import CartItemRow from '@/components/panel/order-cart/CartItemRow.vue'
import CartSummary from '@/components/panel/order-cart/CartSummary.vue'
import StoreSelectHeader from '@/components/panel/order-cart/StoreSelectHeader.vue'
import type { CartItem } from '@/types/cart'
import type { DayType } from '@/types/orderRsv'
import type { Store } from '@/types/store'

const props = defineProps<{
  store: Pick<Store, 'seq' | 'nm'> | null
  items: CartItem[]
  nm: string
  dayTypes: DayType[]
  /** 'HH:mm:ss'. */
  rsvTime: string
  /** 'YYYY-MM-DD'. 필수. */
  startDt: string
  /** 'YYYY-MM-DD'. null = 무기한. */
  endDt: string | null
  cmt: string
  active: boolean
  /** 수정 모드 — true면 CTA 라벨이 "수정 완료" 로 바뀜. */
  isEditing?: boolean
}>()

const emit = defineEmits<{
  'update:nm': [value: string]
  'update:dayTypes': [value: DayType[]]
  'update:rsvTime': [value: string]
  'update:startDt': [value: string]
  'update:endDt': [value: string | null]
  'update:cmt': [value: string]
  'update:active': [value: boolean]
  increment: [menuSeq: number]
  decrement: [menuSeq: number]
  'update-cnt': [menuSeq: number, cnt: number]
  'change-store': []
  reset: []
  cancel: []
  save: []
}>()

const cState = computed<'no-store' | 'no-menu' | 'has-items'>(() =>
  props.store == null ? 'no-store' : props.items.length === 0 ? 'no-menu' : 'has-items',
)

const cTotalCount = computed(() => _.sumBy(props.items, 'cnt'))
const cTotalAmount = computed(() => _.sumBy(props.items, (i) => i.price * i.cnt))

/** 저장 가능 조건 — 모든 필수 필드 입력. */
const cCanSave = computed(
  () =>
    props.store != null &&
    props.items.length > 0 &&
    props.nm.trim().length > 0 &&
    props.dayTypes.length > 0 &&
    props.rsvTime !== '' &&
    props.startDt !== '',
)

// === DatePicker ↔ string 변환 ===

/** rsvTime 'HH:mm:ss' → Date. */
const cRsvTime = computed(() => {
  if (!props.rsvTime) return null
  const [h, m] = props.rsvTime.split(':').map(Number)
  const d = new Date()
  d.setHours(h ?? 0, m ?? 0, 0, 0)
  return d
})

const cStartDt = computed(() => (props.startDt ? new Date(`${props.startDt}T00:00:00`) : null))
const cEndDt = computed(() => (props.endDt ? new Date(`${props.endDt}T00:00:00`) : null))
const cIsEndless = computed(() => props.endDt == null)

function onUpdateRsvTime(t: Date | Date[] | (Date | null)[] | null | undefined) {
  if (!(t instanceof Date)) return
  const hh = String(t.getHours()).padStart(2, '0')
  const mm = String(t.getMinutes()).padStart(2, '0')
  emit('update:rsvTime', `${hh}:${mm}:00`)
}

function onUpdateStartDt(d: Date | Date[] | (Date | null)[] | null | undefined) {
  if (!(d instanceof Date)) return
  emit('update:startDt', toDateString(d))
}

function onUpdateEndDt(d: Date | Date[] | (Date | null)[] | null | undefined) {
  if (!(d instanceof Date)) return
  emit('update:endDt', toDateString(d))
}

function onToggleEndless(v: boolean) {
  emit('update:endDt', v ? null : toDateString(new Date()))
}

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
</script>
