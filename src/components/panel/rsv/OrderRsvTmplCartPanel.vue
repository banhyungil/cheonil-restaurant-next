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
          <BInputText id="tmpl-nm" v-model="nm" placeholder="템플릿 명을 입력하세요" />
        </div>

        <!-- 반복 요일 -->
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-surface-900">
              📅 반복 요일 <span class="text-red-500">*</span>
            </label>
            <DayTypeSelector v-model="dayTypes" />
          </div>
          <!-- active 토글 -->
          <div class="flex flex-col">
            <label class="text-sm font-semibold text-surface-900">활성</label>
            <ToggleSwitch v-model="active" />
          </div>
        </div>

        <!-- 예약 시각 + 시작일 -->
        <div class="flex gap-3">
          <div class="flex flex-1 flex-col gap-1.5">
            <label class="text-sm font-semibold text-surface-900">
              🕐 예약 시각 <span class="text-red-500">*</span>
            </label>
            <DatePicker
              :model-value="mRsvTime"
              time-only
              hour-format="24"
              show-icon
              icon-display="input"
              @update:model-value="(v) => (mRsvTime = v as Date | null)"
            />
          </div>
          <div class="flex flex-1 flex-col gap-1.5">
            <label class="text-sm font-semibold text-surface-900">
              📆 시작일 <span class="text-red-500">*</span>
            </label>
            <DatePicker
            :model-value="mStartDt"
            :min-date="MIN_TODAY"
            date-format="yy-mm-dd"
            show-icon
            @update:model-value="(v) => (mStartDt = v as Date | null)"
          />
          </div>
        </div>

        <!-- 종료일 / 무기한 -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-surface-900">📆 종료일</label>
          <div class="flex items-center gap-2">
            <DatePicker
              :model-value="mEndDt"
              :min-date="cEndMinDate"
              :disabled="mIsEndless"
              date-format="yy-mm-dd"
              show-icon
              class="flex-1"
              @update:model-value="(v) => (mEndDt = v as Date | null)"
            />
            <label class="flex items-center gap-1.5 text-sm">
              <Checkbox v-model="mIsEndless" binary />
              무기한
            </label>
          </div>
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
          v-model="cmt"
          rows="2"
          placeholder="요청사항…"
          class="resize-none text-sm"
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
import { format } from 'date-fns'
import _ from 'lodash'

import { useDateModel } from '@/composables/useDateModel'
import type { CartItem } from '@/types/cart'
import type { DayType } from '@/types/orderRsv'
import type { Store } from '@/types/store'

const props = defineProps<{
  store: Pick<Store, 'seq' | 'nm'> | null
  items: CartItem[]
  /** 수정 모드 — true면 CTA 라벨이 "수정 완료" 로 바뀜. */
  isEditing?: boolean
}>()

const nm = defineModel<string>('nm', { required: true })
const dayTypes = defineModel<DayType[]>('dayTypes', { required: true })
/** 'HH:mm:ss'. */
const rsvTime = defineModel<string>('rsvTime', { required: true })
/** 'YYYY-MM-DD'. 필수. */
const startDt = defineModel<string>('startDt', { required: true })
/** 'YYYY-MM-DD'. null = 무기한. */
const endDt = defineModel<string | null>('endDt', { required: true })
const cmt = defineModel<string>('cmt', { required: true })
const active = defineModel<boolean>('active', { required: true })

watch([() => props.store?.nm, rsvTime], ([newStoreNm], [oldStoreNm]) => {
  // 매장 선택했고, 템플릿 명에 이전 매장명이 포함되어있으면 갱신
  if (newStoreNm && (oldStoreNm == null || oldStoreNm.includes(oldStoreNm))) {
    nm.value = `${newStoreNm} ${rsvTime.value.slice(0, 5)}`
  }
})

const emit = defineEmits<{
  increment: [menuSeq: number]
  decrement: [menuSeq: number]
  'update-cnt': [menuSeq: number, cnt: number]
  'change-store': []
  reset: []
  cancel: []
  save: []
}>()

const cState = computed<'no-store' | 'no-menu' | 'has-items'>(() =>
  props.store == null && props.items.length === 0
    ? 'no-store'
    : props.items.length === 0
      ? 'no-menu'
      : 'has-items',
)

const cTotalCount = computed(() => _.sumBy(props.items, 'cnt'))
const cTotalAmount = computed(() => _.sumBy(props.items, (i) => i.price * i.cnt))

/** 저장 가능 조건 — 모든 필수 필드 입력. */
const cCanSave = computed(
  () =>
    props.store != null &&
    props.items.length > 0 &&
    nm.value.trim().length > 0 &&
    dayTypes.value.length > 0 &&
    rsvTime.value !== '' &&
    startDt.value !== '',
)

// === DatePicker / Checkbox 와 v-model 연결 (writable computed) ===

const DATE_FMT = 'yyyy-MM-dd'

/** 시작일 최소값 — 페이지 mount 시점의 오늘 0시. */
const MIN_TODAY = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()

const mRsvTime = useDateModel(rsvTime, 'HH:mm:ss', false)
const mStartDt = useDateModel(startDt, DATE_FMT, false)
const mEndDt = useDateModel(endDt, DATE_FMT)

/** 종료일 최소값 — 시작일 (없으면 오늘). */
const cEndMinDate = computed(() => mStartDt.value ?? MIN_TODAY)

/** "무기한" 체크박스 — endDt nullable 의 의미적 wrapper. */
const mIsEndless = computed<boolean>({
  get: () => endDt.value == null,
  set: (v) => {
    endDt.value = v ? null : format(new Date(), DATE_FMT)
  },
})
</script>
