<!-- 단위 편집 다이얼로그 — unit null 이면 추가, 있으면 수정 -->
<template>
  <Dialog
    :visible="visible"
    modal
    :header="unit ? '단위 수정' : '단위 추가'"
    :style="{ width: '440px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          단위명 <span class="text-red-500">*</span>
        </label>
        <BInputText v-model="form.nm" placeholder="예: kg, 박스" maxlength="40" />
      </div>

      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <label class="text-sm font-semibold text-surface-900">단위수량 사용</label>
          <span class="text-xs text-surface-500">제품 등록 시 규격(600g, 1.8L 등) 입력</span>
        </div>
        <ToggleSwitch v-model="form.isUnitCnt" />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          기준 단위 <span class="text-xs font-normal text-surface-500">(선택)</span>
        </label>
        <Select
          v-model="form.baseUnitSeq"
          :options="cBaseOptions"
          option-label="nm"
          option-value="seq"
          placeholder="없음 — 자신이 기준 단위"
          show-clear
          class="w-full"
        />
        <p class="text-xs text-surface-500">
          식자재별 가격 비교 시 기준 단위로 환산 (예: g → kg, ml → L)
        </p>
      </div>

      <div v-if="form.baseUnitSeq != null" class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          환산계수 <span class="text-red-500">*</span>
        </label>
        <InputGroup>
          <InputGroupAddon>1 {{ form.nm || '단위' }} =</InputGroupAddon>
          <InputNumber
            v-model="form.baseFactor"
            :min-fraction-digits="0"
            :max-fraction-digits="4"
            :min="0"
            placeholder="0.001"
            :input-class="'text-right'"
            @input="(e) => (form.baseFactor = e.value as number | null)"
          />
          <InputGroupAddon>{{ cBaseNm }}</InputGroupAddon>
        </InputGroup>
      </div>
    </div>

    <template #footer>
      <BButton variant="outlined" color="secondary" @click="emit('update:visible', false)">
        취소
      </BButton>
      <BButton color="primary" :disabled="!cCanSave" :loading="cSaving" @click="onSave">
        {{ unit ? '수정' : '추가' }}
      </BButton>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

import type { UnitSavePayload } from '@/apis/unitsApi'
import { useUnitCreateMutation, useUnitUpdateMutation } from '@/queries/unitsQuery'
import type { Unit } from '@/types/product'

const props = defineProps<{
  visible: boolean
  /** null 이면 추가 모드. */
  unit: Unit | null
  /** 전체 단위 — 기준 단위 선택지 구성용. */
  units: readonly Unit[]
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  saved: [unit: Unit]
}>()

/**
 * baseFactor — InputNumber 는 v-model 이 blur 시에만 갱신되므로 @input 으로 타이핑 중 값도 반영.
 * (안 하면 입력 직후 저장 버튼이 비활성 상태로 남고, 비활성 버튼 클릭은 blur 를 일으키지 않아 값이 끝내 반영 안 됨)
 */
const form = reactive<UnitSavePayload>({
  nm: '',
  isUnitCnt: false,
  baseUnitSeq: null,
  baseFactor: null,
})

// 다이얼로그 열릴 때마다 초기화 — 수정 모드면 기존 값으로 prefill
watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    const u = props.unit
    Object.assign(form, {
      nm: u?.nm ?? '',
      isUnitCnt: u?.isUnitCnt ?? false,
      baseUnitSeq: u?.baseUnitSeq ?? null,
      baseFactor: u?.baseFactor ?? null,
    })
  },
  { immediate: true },
)

/** 기준 단위 선택지 — 자기 자신이 기준 단위인 단위만 (연쇄 불가), 자기 자신 제외. */
const cBaseOptions = computed(() =>
  props.units.filter((u) => u.baseUnitSeq == null && u.seq !== props.unit?.seq),
)

const cBaseNm = computed(() => props.units.find((u) => u.seq === form.baseUnitSeq)?.nm ?? '')

const cCanSave = computed(
  () =>
    form.nm.trim().length > 0 &&
    (form.baseUnitSeq == null || (form.baseFactor != null && form.baseFactor > 0)),
)

const toast = useToast()
const { mutate: createUnit, isPending: isCreating } = useUnitCreateMutation()
const { mutate: updateUnit, isPending: isUpdating } = useUnitUpdateMutation()
const cSaving = computed(() => isCreating.value || isUpdating.value)

function onSave() {
  if (!cCanSave.value) return
  const payload: UnitSavePayload = {
    ...form,
    nm: form.nm.trim(),
    baseFactor: form.baseUnitSeq == null ? null : form.baseFactor,
  }
  // 실패 시 글로벌 토스트가 backend 메시지 노출 — 다이얼로그는 열어둔다
  const onSuccess = (saved: Unit) => {
    toast.add({ severity: 'success', summary: props.unit ? '단위 수정' : '단위 추가', life: 2000 })
    emit('saved', saved)
    emit('update:visible', false)
  }
  if (props.unit) {
    updateUnit({ seq: props.unit.seq, payload }, { onSuccess })
  } else {
    createUnit(payload, { onSuccess })
  }
}
</script>
