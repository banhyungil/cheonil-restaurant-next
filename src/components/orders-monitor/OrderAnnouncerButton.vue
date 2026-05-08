<!--
  주문 음성 알림 버튼 + 설정 Popover.
  자체적으로 useOrderAnnouncer(orders) 호출 — SSE 이벤트 + 임계치 알람 + 토글/설정 UI 모두 응집.
  단일 인스턴스 전제 — 한 페이지에 두 번 mount 하지 말 것 (bus 중복 구독).
-->
<template>
  <BButton
    :variant="enabled ? 'filled' : 'outlined'"
    color="secondary"
    title="음성 알림 설정"
    @click="onTogglePopover"
  >
    <Volume2 v-if="enabled" :size="16" />
    <VolumeX v-else :size="16" />
  </BButton>
  <Popover ref="popoverRef">
    <div class="flex min-w-64 flex-col gap-3 p-1">
      <!-- 음성 알림 섹션 -->
      <section class="flex flex-col gap-2.5">
        <h4 class="text-xs font-bold uppercase tracking-wide text-surface-500">음성 알림</h4>
        <label class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-surface-700">활성화</span>
          <ToggleSwitch v-model="enabled" />
        </label>
        <label class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-surface-700">반복 횟수</span>
          <InputNumber
            v-model="repeatCount"
            :min="REPEAT_MIN"
            :max="REPEAT_MAX"
            show-buttons
            button-layout="horizontal"
            :input-class="'w-10 text-center'"
            :disabled="!enabled"
          />
        </label>
        <label class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-surface-700">속도</span>
          <InputNumber
            v-model="rate"
            :min="RATE_MIN"
            :max="RATE_MAX"
            :step="RATE_STEP"
            :min-fraction-digits="1"
            :max-fraction-digits="2"
            suffix="x"
            show-buttons
            button-layout="horizontal"
            :input-class="'w-18 text-center'"
            :disabled="!enabled"
          />
        </label>
      </section>

      <div class="h-px bg-surface-200" />

      <!-- 임계치 알람 섹션 -->
      <section class="flex flex-col gap-2.5">
        <h4 class="text-xs font-bold uppercase tracking-wide text-surface-500">임계치 알람</h4>
        <div
          v-for="row in ALERT_ROWS"
          :key="row.sound"
          class="flex items-center justify-between gap-3"
        >
          <span class="text-sm font-medium text-surface-700">{{ row.label }}</span>
          <div class="flex items-center gap-1.5">
            <BButton
              variant="text"
              color="secondary"
              size="sm"
              v-tooltip="'미리듣기'"
              @click="onPreview(row.sound)"
            >
              <Play :size="14" />
            </BButton>
            <ToggleSwitch v-model="row.model.value" :disabled="!enabled" />
          </div>
        </div>
      </section>

      <div class="h-px bg-surface-200" />

      <!-- 임의 발화 섹션 -->
      <section class="flex flex-col gap-2.5">
        <h4 class="text-xs font-bold uppercase tracking-wide text-surface-500">임의 발화</h4>
        <!-- preset chips — 클릭 시 즉시 발화 -->
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="p in CUSTOM_PRESETS"
            :key="p"
            type="button"
            class="rounded-md bg-surface-100 px-2 py-1 text-xs text-surface-700 transition-colors hover:bg-surface-200"
            @click="onSpeakPreset(p)"
          >
            {{ p }}
          </button>
        </div>
        <!-- 직접 입력 — Enter 또는 ▶ 로 발화, 발화 후 클리어 -->
        <div class="flex items-center gap-1.5">
          <BInputText
            v-model="customText"
            placeholder="직접 입력 (최대 30자)"
            :maxlength="CUSTOM_MAX_LEN"
            class="flex-1"
            @keyup.enter="onSpeakCustom"
          />
          <BButton
            variant="text"
            color="secondary"
            size="sm"
            :disabled="!customText.trim()"
            @click="onSpeakCustom"
          >
            <Play :size="14" />
          </BButton>
        </div>
      </section>
    </div>
  </Popover>
</template>

<script setup lang="ts">
import { vTooltip } from 'floating-vue'
import { Play, Volume2, VolumeX } from 'lucide-vue-next'
import type Popover from 'primevue/popover'

import { announceCustom, useOrderAnnouncer } from '@/composables/useOrderAnnouncer'
import type { OrderExt } from '@/types/order'
import { playAlert, type Sounds } from '@/utils/announceQueue'

/** 임의 발화 자주 쓰는 멘트 — 클릭 시 즉시 발화. */
const CUSTOM_PRESETS = [
  '잠시만 기다려주세요',
  '포장 준비됐습니다',
  '주방 도와주세요',
  '청소 부탁드립니다',
] as const

const CUSTOM_MAX_LEN = 30

const props = defineProps<{
  /** 임계치 알람용 — useOrderAnnouncer 가 내부에서 READY 카운트 watch. */
  orders: OrderExt[] | undefined
}>()

const {
  enabled,
  repeatCount,
  rate,
  alertCrazy,
  alertClear,
  alertWelcome,
  REPEAT_MIN,
  REPEAT_MAX,
  RATE_MIN,
  RATE_MAX,
  RATE_STEP,
  THRESHOLD_BUSY,
} = useOrderAnnouncer(() => props.orders)

/** 임계치 알람 row 데이터 — 라벨/사운드/토글 ref 매핑. v-for 로 일관 렌더. */
const ALERT_ROWS = [
  { label: `폭주 (${THRESHOLD_BUSY}건 이상)`, sound: 'CRAZY' as Sounds, model: alertCrazy },
  { label: '처리 완료', sound: 'CLEAR' as Sounds, model: alertClear },
  { label: '첫 주문', sound: 'WELCOME' as Sounds, model: alertWelcome },
]

const popoverRef = ref<InstanceType<typeof Popover> | null>(null)
function onTogglePopover(e: Event) {
  popoverRef.value?.toggle(e)
}

/** 미리듣기 — 큐 우회 즉시 재생. 사용자 클릭(user gesture) 이라 autoplay 정책 통과. */
function onPreview(sound: Sounds) {
  playAlert(sound)
}

const customText = ref('')

/** preset 클릭 — 즉시 발화. input 은 건드리지 않음. */
function onSpeakPreset(text: string) {
  announceCustom(text)
}

/** 직접 입력 발화 — Enter 또는 ▶. 발화 후 input 클리어. */
function onSpeakCustom() {
  if (!customText.value.trim()) return
  announceCustom(customText.value)
  customText.value = ''
}
</script>
