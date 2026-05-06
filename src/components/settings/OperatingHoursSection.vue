<!--
  운영 시간 설정 섹션 — 시작/종료 시각 (시 단위) inline 편집.
  저장은 페이지 상단 [적용] 버튼이 일괄 처리. 기본값 복원만 섹션 로컬.
  defineExpose 로 isDirty / isValid / apply 제공.
-->
<template>
  <section
    class="operating-hours-section flex flex-col gap-2.5 rounded-lg p-4 transition-colors hover:bg-surface-50"
  >
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Clock :size="16" class="text-primary-500" />
        <h3 class="text-sm font-semibold text-surface-900">운영 시간</h3>
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
        <span class="text-sm text-surface-700">시작</span>
        <InputNumber
          v-model="draft.startHour"
          :min="0"
          :max="23"
          show-buttons
          button-layout="horizontal"
          :input-class="'w-12 text-center'"
        />
        <span class="text-sm text-surface-500">시</span>
      </label>
      <span class="text-surface-400">~</span>
      <label class="flex items-center gap-2">
        <span class="text-sm text-surface-700">종료</span>
        <InputNumber
          v-model="draft.endHour"
          :min="0"
          :max="23"
          show-buttons
          button-layout="horizontal"
          :input-class="'w-12 text-center'"
        />
        <span class="text-sm text-surface-500">시</span>
      </label>
    </div>

    <p v-if="!cIsValid" class="text-xs text-red-600">종료 시각은 시작 시각보다 커야 합니다.</p>
    <p v-else class="text-xs text-surface-500">
      ※ 영업 시간 외 주문 차단 / 통계 시간대 bucket 결정에 영향. 기본값
      {{ setting?.defaultConfig.startHour ?? '-' }}~{{ setting?.defaultConfig.endHour ?? '-' }}시.
    </p>
  </section>
</template>

<script setup lang="ts">
import { vTooltip } from 'floating-vue'
import { useToast } from 'primevue/usetoast'
import { Clock, RotateCcw } from 'lucide-vue-next'
import { computed, reactive, watch } from 'vue'

import { useSettingRestoreMutation, useSettingUpdateMutation } from '@/queries/settingsQuery'
import type { OperatingHoursConfig, Setting } from '@/types/setting'

const props = defineProps<{
  setting: Setting<'OPERATING_HOURS'> | undefined
}>()

const toast = useToast()
const { mutateAsync: updateSetting } = useSettingUpdateMutation<'OPERATING_HOURS'>()
const { mutate: restoreSetting } = useSettingRestoreMutation<'OPERATING_HOURS'>()

// draft = 사용자가 편집 중인 값. setting 변경 시 동기화 (저장/복원 후 hydrate).
const draft = reactive<OperatingHoursConfig>({ startHour: 0, endHour: 0 })

watch(
  () => props.setting?.config,
  (cfg) => {
    if (cfg) {
      draft.startHour = cfg.startHour
      draft.endHour = cfg.endHour
    }
  },
  { immediate: true },
)

const cIsValid = computed(() => draft.endHour > draft.startHour)

const cIsDirty = computed(() => {
  const cfg = props.setting?.config
  if (!cfg) return false
  return cfg.startHour !== draft.startHour || cfg.endHour !== draft.endHour
})

/** 페이지 상단 [적용] 버튼이 호출. dirty + valid 일 때만 실제 PUT. */
async function apply(): Promise<void> {
  if (!cIsValid.value || !cIsDirty.value) return
  await updateSetting({
    code: 'OPERATING_HOURS',
    userConfig: { startHour: draft.startHour, endHour: draft.endHour },
  })
}

function onRestore() {
  restoreSetting('OPERATING_HOURS', {
    onSuccess: () => toast.add({ severity: 'success', summary: '기본값 복원', life: 2000 }),
  })
}

defineExpose({
  isDirty: cIsDirty,
  isValid: cIsValid,
  apply,
})
</script>
