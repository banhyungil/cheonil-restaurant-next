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
  <Popover ref="popoverRef" @show="popoverVisible = true" @hide="popoverVisible = false">
    <div class="flex w-72 flex-col gap-3 p-1">
      <!-- 음성 알림 섹션 -->
      <section class="flex flex-col gap-2.5">
        <div class="flex items-center gap-1.5">
          <h4 class="text-xs font-bold uppercase tracking-wide text-surface-500">음성 알림</h4>
          <Info
            :size="12"
            class="text-surface-400"
            v-tooltip="'음성이 안 들리면 화면을 한 번 클릭해주세요 (브라우저 자동재생 정책)'"
          />
        </div>
        <label class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-surface-700">활성화</span>
          <div class="flex items-center gap-1.5">
            <BButton
              variant="text"
              color="secondary"
              size="sm"
              v-tooltip="'발화 테스트'"
              @click="onPreviewSpeech"
            >
              <Play :size="14" />
            </BButton>
            <ToggleSwitch v-model="enabled" />
          </div>
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
        <label class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-surface-700">음높이</span>
          <InputNumber
            v-model="pitch"
            :min="PITCH_MIN"
            :max="PITCH_MAX"
            :step="PITCH_STEP"
            :min-fraction-digits="1"
            :max-fraction-digits="2"
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
        <!-- 지연 알람 — BELL + TTS (단계별 1회: warning, danger 진입 시 각각 발화) -->
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-surface-700">지연 (warning↑)</span>
          <div class="flex items-center gap-1.5">
            <BButton
              variant="text"
              color="secondary"
              size="sm"
              v-tooltip="'미리듣기'"
              @click="onPreviewWarn"
            >
              <Play :size="14" />
            </BButton>
            <ToggleSwitch v-model="alertWarning" :disabled="!enabled" />
          </div>
        </div>
      </section>

      <div class="h-px bg-surface-200" />

      <!-- 임의 발화 섹션 -->
      <section class="flex flex-col gap-2.5">
        <h4 class="text-xs font-bold uppercase tracking-wide text-surface-500">직접 입력</h4>
        <!-- preset chips — 클릭 시 발화, ✕ 로 삭제, 드래그로 정렬.
             가로 배치 + 폭 초과 시 wrap, 6자 초과 시 ellipsis. -->
        <VueDraggable
          v-if="announcerPresets.length > 0"
          v-model="announcerPresets"
          :animation="200"
          ghost-class="opacity-40"
          class="flex flex-wrap gap-1.5"
        >
          <span
            v-for="p in announcerPresets"
            :key="p"
            class="flex cursor-grab items-center rounded-md bg-surface-100 text-xs"
          >
            <button
              type="button"
              class="rounded-l-md px-2 py-1 text-surface-700 hover:bg-surface-200"
              v-tooltip="p"
              @click="onSpeakPreset(p)"
            >
              {{ truncate(p) }}
            </button>
            <button
              type="button"
              class="rounded-r-md px-1.5 py-1 text-surface-400 hover:bg-surface-200 hover:text-surface-700"
              v-tooltip="'삭제'"
              @click.stop="onRemovePreset(p)"
            >
              <X :size="12" />
            </button>
          </span>
        </VueDraggable>
        <p v-else class="text-xs text-surface-400">
          ※ 직접 입력 후 <BookmarkPlus :size="11" class="inline" /> 으로 자주 쓰는 멘트 등록
        </p>
        <!-- 직접 입력 — Enter 또는 ▶ 로 발화, 발화 후 클리어. ＋ 로 프리셋 등록. -->
        <div class="flex items-center gap-1.5">
          <BInputText
            ref="customInputRef"
            v-model="customText"
            :placeholder="`직접 입력 (최대 ${PRESET_MAX_LEN}자)`"
            :maxlength="PRESET_MAX_LEN"
            class="flex-1"
            @keyup.enter="onSpeakCustom"
          />
          <BButton
            variant="text"
            color="secondary"
            size="sm"
            :disabled="!customText.trim()"
            v-tooltip="'발화'"
            @click="onSpeakCustom"
          >
            <Play :size="14" />
          </BButton>
          <BButton
            variant="text"
            color="secondary"
            size="sm"
            :disabled="!customText.trim() || announcerPresets.length >= PRESET_MAX_COUNT"
            v-tooltip="
              announcerPresets.length >= PRESET_MAX_COUNT
                ? `최대 ${PRESET_MAX_COUNT}개`
                : '프리셋으로 추가'
            "
            @click="onAddPreset"
          >
            <BookmarkPlus :size="14" />
          </BButton>
        </div>
      </section>
    </div>
  </Popover>
</template>

<script setup lang="ts">
import { promiseTimeout } from '@vueuse/core'
import { vTooltip } from 'floating-vue'
import { BookmarkPlus, Info, Play, Volume2, VolumeX, X } from 'lucide-vue-next'
import type Popover from 'primevue/popover'
import { VueDraggable } from 'vue-draggable-plus'

import {
  announceCustom,
  announcerPresets,
  PRESET_MAX_COUNT,
  PRESET_MAX_LEN,
  useOrderAnnouncer,
} from '@/composables/useOrderAnnouncer'
import type { OrderExt } from '@/types/order'
import { enqueueAnnounce, playAlert, speakAsync, type Sounds } from '@/utils/announceQueue'

const props = defineProps<{
  /** 임계치 알람용 — useOrderAnnouncer 가 내부에서 READY 카운트 watch. */
  orders: OrderExt[] | undefined
}>()

const {
  enabled,
  repeatCount,
  rate,
  pitch,
  alertCrazy,
  alertClear,
  alertWelcome,
  alertWarning,
  REPEAT_MIN,
  REPEAT_MAX,
  RATE_MIN,
  RATE_MAX,
  RATE_STEP,
  PITCH_MIN,
  PITCH_MAX,
  PITCH_STEP,
  THRESHOLD_BUSY,
} = useOrderAnnouncer(() => props.orders)

/** 임계치 알람 row 데이터 — 라벨/사운드/토글 ref 매핑. v-for 로 일관 렌더. */
const ALERT_ROWS = [
  { label: `폭주 (${THRESHOLD_BUSY}건 이상)`, sound: 'CRAZY' as Sounds, model: alertCrazy },
  { label: '처리 완료', sound: 'CLEAR' as Sounds, model: alertClear },
  { label: '첫 주문', sound: 'WELCOME' as Sounds, model: alertWelcome },
]

const popoverRef = ref<InstanceType<typeof Popover> | null>(null)
const popoverVisible = ref(false)
function onTogglePopover(e: Event) {
  popoverRef.value?.toggle(e)
}

// Popover 열릴 때 직접입력 input 자동 포커스 — 키보드만으로 즉시 발화 입력 가능.
const customInputRef = ref<{ $el?: HTMLElement }>()
useAutoFocus(customInputRef, popoverVisible)

/** 미리듣기 — 큐 우회 즉시 재생. 사용자 클릭(user gesture) 이라 autoplay 정책 통과. */
function onPreview(sound: Sounds) {
  playAlert(sound)
}

/** 발화 테스트 — 현재 rate/pitch 설정으로 샘플 멘트 발화. master enabled 무관 (announceCustom 정책). */
function onPreviewSpeech() {
  announceCustom('음성 알림 테스트')
}

/** 지연 알람 미리듣기 — 실제 발화 시퀀스(BELL + TTS) 그대로 큐 enqueue. master 무관. */
function onPreviewWarn() {
  enqueueAnnounce(async () => {
    playAlert('BELL')
    await promiseTimeout(1000)
    await speakAsync('테스트 매장, 25분 지연', {
      rate: rate.value,
      pitch: pitch.value,
    })
  })
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

/** 직접 입력 텍스트를 프리셋 끝에 등록. 빈값/최대치 초과는 가드. 등록 후 input 클리어. */
function onAddPreset() {
  const trimmed = customText.value.trim()
  if (!trimmed) return
  if (announcerPresets.value.length >= PRESET_MAX_COUNT) return
  announcerPresets.value.push(trimmed)
  customText.value = ''
}

function onRemovePreset(text: string) {
  announcerPresets.value = announcerPresets.value.filter((p) => p !== text)
}

/** 프리셋 chip 표시 — 6자 초과 시 ellipsis. 전체 텍스트는 hover tooltip 으로. */
const PRESET_DISPLAY_MAX = 6
function truncate(text: string) {
  return text.length > PRESET_DISPLAY_MAX ? text.slice(0, PRESET_DISPLAY_MAX) + '…' : text
}
</script>
