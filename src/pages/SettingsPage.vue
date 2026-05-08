<!--
  시스템 설정 페이지.
  섹션 구분은 hover 시 약한 bg 강조만. 카드 형태 아님.
  저장은 페이지 상단 [적용] 버튼이 일괄 처리 (dirty + valid 섹션만 호출).
  기본값 복원은 각 섹션 로컬.
-->
<template>
  <section class="settings-page flex h-full flex-col gap-5 px-8 py-6">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-surface-900">설정</h1>
      <BButton color="primary" :disabled="!cCanApply" :loading="applying" @click="onApply">
        <Check :size="16" />
        적용{{ cDirtyCount > 0 ? ` (${cDirtyCount})` : '' }}
      </BButton>
    </header>

    <div class="flex flex-col gap-1">
      <OperatingHoursSection ref="operatingRef" :setting="cOperatingHours" />
      <RsvSchedulerSection ref="rsvSchedulerRef" :setting="cRsvScheduler" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'

import { useSettingsQuery } from '@/queries/settingsQuery'
import type { Setting } from '@/types/setting'

import OperatingHoursSection from '@/components/settings/OperatingHoursSection.vue'
import RsvSchedulerSection from '@/components/settings/RsvSchedulerSection.vue'

const toast = useToast()
const { data: settings } = useSettingsQuery()

const cOperatingHours = computed(() =>
  (settings.value ?? []).find((s): s is Setting<'OPERATING_HOURS'> => s.code === 'OPERATING_HOURS'),
)
const cRsvScheduler = computed(() =>
  (settings.value ?? []).find((s): s is Setting<'RSV_SCHEDULER'> => s.code === 'RSV_SCHEDULER'),
)

// 섹션 ref — 신규 섹션 추가 시 sections 배열에 같이 등록.
const operatingRef = ref<InstanceType<typeof OperatingHoursSection> | null>(null)
const rsvSchedulerRef = ref<InstanceType<typeof RsvSchedulerSection> | null>(null)
const cSections = computed(() =>
  [operatingRef.value, rsvSchedulerRef.value].filter((s) => s != null),
)

const cDirtyCount = computed(() => cSections.value.filter((s) => s.isDirty).length)
const cAllValid = computed(() => cSections.value.every((s) => s.isValid))
const cCanApply = computed(() => cDirtyCount.value > 0 && cAllValid.value)

const applying = ref(false)

async function onApply() {
  if (!cCanApply.value) return
  applying.value = true
  try {
    await Promise.all(cSections.value.filter((s) => s.isDirty).map((s) => s.apply()))
    toast.add({ severity: 'success', summary: '설정 저장 완료', life: 2000 })
  } finally {
    applying.value = false
  }
}
</script>
