<template>
  <aside
    class="order-cart-panel flex h-full w-130 shrink-0 flex-col gap-4 rounded-xl border border-surface-200 bg-surface-0 p-6"
  >
    <!-- 매장 헤더 -->
    <StoreSelectHeader
      :store-name="store?.nm ?? null"
      @change-store="emit('change-store')"
      @reset="emit('reset')"
    />

    <div class="h-px w-full bg-surface-200" />

    <!-- 본문: 상태별 분기 -->
    <CartEmptyState
      v-if="cState === 'no-store'"
      icon="🏪"
      title="매장을 선택해 주문을 시작하세요"
      description="좌측에서 주문받을 매장을 클릭하세요"
    />
    <CartEmptyState
      v-else-if="cState === 'no-menu'"
      icon="🍽"
      title="메뉴를 선택해 담아주세요"
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

    <div class="h-px w-full bg-surface-200" />

    <!-- 비고 -->
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between">
        <label for="order-memo" class="text-sm font-semibold text-surface-900">비고</label>
        <BButton
          variant="text"
          color="secondary"
          size="sm"
          :loading="transcribing"
          v-tooltip="recording ? '녹음 종료' : '음성 입력 (마이크)'"
          @click="onMicToggle"
        >
          <Square v-if="recording" :size="14" class="text-red-500" />
          <Mic v-else :size="14" />
        </BButton>
      </div>
      <Textarea
        id="order-memo"
        :model-value="memo"
        rows="3"
        :placeholder="recording ? '🎙 녹음 중… 종료 버튼 클릭' : '덜맵게, 포장 여부 등 요청사항…'"
        class="h-20 resize-none text-sm"
        :disabled="cState !== 'has-items'"
        @update:model-value="(v) => emit('update:memo', String(v ?? ''))"
      />
    </div>

    <!-- 총액 -->
    <CartSummary :total-count="cTotalCount" :total-amount="cTotalAmount" />

    <!-- CTA: 상태별 label + 수정 모드 분기 -->
    <BButton
      color="primary"
      size="lg"
      class="flex-col gap-0.5"
      :disabled="cState !== 'has-items'"
      @click="emit('order')"
    >
      <span>{{ isEditing ? '수정완료' : '주문완료' }}</span>
      <span v-if="cState === 'no-store'" class="text-xs font-medium opacity-85">
        매장을 선택해주세요
      </span>
      <span v-else-if="cState === 'no-menu'" class="text-xs font-medium opacity-85">
        메뉴를 선택해주세요
      </span>
    </BButton>
  </aside>
</template>

<script setup lang="ts">
import { vTooltip } from 'floating-vue'
import _ from 'lodash'
import { Mic, Square } from 'lucide-vue-next'
import { computed } from 'vue'

import { useSpeechRecorder } from '@/composables/useSpeechRecorder'
import type { CartItem } from '@/types/cart'
import type { Store } from '@/types/store'
import { getErrorMessage } from '@/apis/api'
import { useToast } from 'primevue/usetoast'

const props = defineProps<{
  store: Pick<Store, 'seq' | 'nm'> | null
  items: CartItem[]
  memo: string
  /** 수정 모드 — true면 CTA 라벨이 "수정완료" 로 바뀜. */
  isEditing?: boolean
}>()

const emit = defineEmits<{
  'update:memo': [value: string]
  increment: [menuSeq: number]
  decrement: [menuSeq: number]
  'update-cnt': [menuSeq: number, cnt: number]
  'change-store': []
  reset: []
  order: []
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

const toast = useToast()
const { recording, transcribing, start, stop } = useSpeechRecorder()

/** 녹음 시작/종료 토글 — 종료 시 텍스트를 기존 memo 뒤에 append. */
async function onMicToggle() {
  if (recording.value) {
    try {
      const text = await stop()
      if (!text) return
      const next = props.memo ? `${props.memo} ${text}` : text
      emit('update:memo', next)
    } catch (e) {
      toast.add({ severity: 'error', summary: '음성 변환 실패', detail: getErrorMessage(e), life: 3000 })
    }
  } else {
    try {
      await start()
    } catch {
      toast.add({
        severity: 'error',
        summary: '마이크 권한 필요',
        detail: '브라우저 마이크 사용 권한을 허용해주세요',
        life: 3000,
      })
    }
  }
}
</script>
