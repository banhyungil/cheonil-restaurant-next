<!--
  예약 스케줄러 설정 섹션 — leadMinutes (분) inline 편집.
  저장은 페이지 상단 [적용] 버튼이 일괄 처리. 기본값 복원만 섹션 로컬.
  defineExpose 로 isDirty / isValid / apply 제공.
-->
<template>
  <section
    class="rsv-scheduler-section flex flex-col gap-2.5 rounded-lg p-4 transition-colors hover:bg-surface-50"
  >
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <CalendarClock :size="16" class="text-primary-500" />
        <h3 class="text-sm font-semibold text-surface-900">예약 자동 생성 시점</h3>
        <span v-if="cIsDirty" class="text-xs text-amber-600">· 변경됨</span>
      </div>
      <BButton
        v-tooltip="'기본값으로 되돌리기'"
        variant="text"
        color="secondary"
        size="sm"
        :disabled="!setting?.userConfig"
        @click="onRestore"
      >
        <RotateCcw :size="13" />
        기본값
      </BButton>
    </header>

    <div class="flex items-center gap-3">
      <label class="flex items-center gap-2">
        <span class="text-sm text-surface-700">예약 시각</span>
        <InputNumber
          v-model="draft.leadMinutes"
          :min="LEAD_MIN"
          :max="LEAD_MAX"
          :step="LEAD_STEP"
          show-buttons
          button-layout="horizontal"
          :input-class="'w-14 text-center'"
        />
        <span class="text-sm text-surface-500">분 전 자동 생성</span>
      </label>
    </div>

    <p v-if="!cIsValid" class="text-xs text-red-600">
      {{ LEAD_MIN }}~{{ LEAD_MAX }}분 사이 값을 입력하세요. (cron 주기 10분 이상 권장)
    </p>
    <p v-else class="text-xs text-surface-500">
      ※ 템플릿에서 인스턴스가 자동 생성되는 시점. 기본값
      {{ setting?.defaultConfig.leadMinutes ?? '-' }}분.
    </p>
  </section>
</template>

<script setup lang="ts">
import { vTooltip } from 'floating-vue'
import { useToast } from 'primevue/usetoast'
import { CalendarClock, RotateCcw } from 'lucide-vue-next'
import { computed, reactive, watch } from 'vue'

import { useSettingRestoreMutation, useSettingUpdateMutation } from '@/queries/settingsQuery'
import type { RsvSchedulerConfig, Setting } from '@/types/setting'

/** UI 입력 범위 — cron 주기(10분) 이상, 너무 미래는 의미 없음. */
const LEAD_MIN = 10
const LEAD_MAX = 240
const LEAD_STEP = 10

const props = defineProps<{
  setting: Setting<'RSV_SCHEDULER'> | undefined
}>()

const toast = useToast()
const { mutateAsync: updateSetting } = useSettingUpdateMutation<'RSV_SCHEDULER'>()
const { mutate: restoreSetting } = useSettingRestoreMutation<'RSV_SCHEDULER'>()

const draft = reactive<RsvSchedulerConfig>({ leadMinutes: 60 })

watch(
  () => props.setting?.config,
  (cfg) => {
    if (cfg) draft.leadMinutes = cfg.leadMinutes
  },
  { immediate: true },
)

const cIsValid = computed(
  () => draft.leadMinutes >= LEAD_MIN && draft.leadMinutes <= LEAD_MAX,
)

const cIsDirty = computed(() => {
  const cfg = props.setting?.config
  if (!cfg) return false
  return cfg.leadMinutes !== draft.leadMinutes
})

async function apply(): Promise<void> {
  if (!cIsValid.value || !cIsDirty.value) return
  await updateSetting({
    code: 'RSV_SCHEDULER',
    userConfig: { leadMinutes: draft.leadMinutes },
  })
}

function onRestore() {
  restoreSetting('RSV_SCHEDULER', {
    onSuccess: () => toast.add({ severity: 'success', summary: '기본값 복원', life: 2000 }),
  })
}

defineExpose({
  isDirty: cIsDirty,
  isValid: cIsValid,
  apply,
})
</script>
