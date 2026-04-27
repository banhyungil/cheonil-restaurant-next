<template>
  <aside
    class="rsv-info-panel flex h-full w-130 shrink-0 flex-col gap-4 rounded-xl border border-surface-200 bg-surface-0 p-6"
  >
    <!-- 매장 헤더 (order-cart 의 StoreSelectHeader 재사용) -->
    <StoreSelectHeader
      :store-name="store?.nm ?? null"
      @change-store="emit('change-store')"
      @reset="emit('reset')"
    />

    <div class="h-px w-full bg-surface-200" />

    <!-- 매장 미선택 — 안내 -->
    <CartEmptyState
      v-if="cState === 'no-store'"
      icon="🏪"
      title="매장을 선택해 예약을 시작하세요"
      description="좌측에서 예약할 매장을 클릭하세요"
    />

    <template v-else>
      <!-- 예약 정보: 일시 + 비고 -->
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-surface-900">📅 예약 일시 *</label>
          <div class="flex gap-2">
            <DatePicker
              :model-value="cRsvAtDate"
              date-format="yy-mm-dd"
              show-icon
              class="flex-1"
              @update:model-value="onUpdateDate"
            />
            <DatePicker
              :model-value="cRsvAtTime"
              time-only
              hour-format="24"
              show-icon
              icon-display="input"
              class="flex-1"
              @update:model-value="onUpdateTime"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="rsv-memo" class="text-sm font-semibold text-surface-900">비고</label>
          <Textarea
            id="rsv-memo"
            :model-value="memo"
            rows="3"
            placeholder="알림톡, 포장 여부 등 요청사항…"
            class="h-20 resize-none text-sm"
            @update:model-value="(v) => emit('update:memo', String(v ?? ''))"
          />
        </div>
      </div>

      <div class="h-px w-full bg-surface-200" />

      <!-- 담긴 메뉴 -->
      <div class="flex flex-col gap-1.5">
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
    </template>

    <!-- 합계 -->
    <CartSummary :total-count="cTotalCount" :total-amount="cTotalAmount" />

    <!-- CTA: [취소] [예약 등록 / 수정 완료] -->
    <div class="flex gap-2">
      <BButton
        variant="outlined"
        color="secondary"
        class="h-12! flex-1!"
        @click="emit('cancel')"
      >
        취소
      </BButton>
      <BButton
        color="primary"
        class="h-12! flex-2!"
        :disabled="cState !== 'has-items' || !rsvAt"
        @click="emit('save')"
      >
        💾 {{ isEditing ? '수정 완료' : '예약 등록' }}
      </BButton>
    </div>
  </aside>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { computed } from 'vue'

import CartEmptyState from '@/components/panel/order-cart/CartEmptyState.vue'
import CartItemRow from '@/components/panel/order-cart/CartItemRow.vue'
import CartSummary from '@/components/panel/order-cart/CartSummary.vue'
import StoreSelectHeader from '@/components/panel/order-cart/StoreSelectHeader.vue'
import type { CartItem } from '@/types/cart'
import type { Store } from '@/types/store'

const props = defineProps<{
  store: Pick<Store, 'seq' | 'nm'> | null
  items: CartItem[]
  memo: string
  /** ISO. 빈 문자열이면 미설정 (CTA 비활성). */
  rsvAt: string
  /** 수정 모드 — true면 CTA 라벨이 "수정 완료" 로 바뀜. */
  isEditing?: boolean
}>()

const emit = defineEmits<{
  'update:memo': [value: string]
  'update:rsvAt': [value: string]
  increment: [menuSeq: number]
  decrement: [menuSeq: number]
  'update-cnt': [menuSeq: number, cnt: number]
  'change-store': []
  reset: []
  cancel: []
  save: []
}>()

const cState = computed<'no-store' | 'no-menu' | 'has-items'>(() =>
  props.store == null
    ? 'no-store'
    : props.items.length === 0
      ? 'no-menu'
      : 'has-items',
)

const cTotalCount = computed(() => _.sumBy(props.items, 'cnt'))
const cTotalAmount = computed(() => _.sumBy(props.items, (i) => i.price * i.cnt))

/** rsvAt 의 날짜 부분만 — DatePicker 가 Date 객체를 요구. */
const cRsvAtDate = computed(() => (props.rsvAt ? new Date(props.rsvAt) : null))
/** rsvAt 의 시간 부분 — DatePicker time-only 도 동일 Date 객체 사용. */
const cRsvAtTime = computed(() => (props.rsvAt ? new Date(props.rsvAt) : null))

function onUpdateDate(d: Date | Date[] | (Date | null)[] | null | undefined) {
  if (!(d instanceof Date)) return
  const cur = props.rsvAt ? new Date(props.rsvAt) : new Date()
  cur.setFullYear(d.getFullYear(), d.getMonth(), d.getDate())
  emit('update:rsvAt', cur.toISOString())
}

function onUpdateTime(t: Date | Date[] | (Date | null)[] | null | undefined) {
  if (!(t instanceof Date)) return
  const cur = props.rsvAt ? new Date(props.rsvAt) : new Date()
  cur.setHours(t.getHours(), t.getMinutes(), 0, 0)
  emit('update:rsvAt', cur.toISOString())
}
</script>
