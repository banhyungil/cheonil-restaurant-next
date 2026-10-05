<!-- 지출 카테고리 편집 다이얼로그 — ctg null 이면 추가, 있으면 수정(이름 변경 / 이동) -->
<template>
  <Dialog
    :visible="visible"
    modal
    :header="ctg ? '카테고리 수정' : '카테고리 추가'"
    :style="{ width: '440px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          상위 카테고리 <span class="text-xs font-normal text-surface-500">(선택)</span>
        </label>
        <TreeSelect
          v-model="selParentKeys"
          :options="cParentOptions"
          selection-mode="single"
          placeholder="없음 — 최상위"
          show-clear
          class="w-full"
        />
        <p v-if="ctg" class="text-xs text-surface-500">
          상위를 바꾸면 하위 카테고리도 함께 이동합니다.
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          카테고리명 <span class="text-red-500">*</span>
        </label>
        <BInputText v-model="nm" placeholder="예: 식자재, 공과금" maxlength="50" />
      </div>
    </div>

    <template #footer>
      <BButton variant="outlined" color="secondary" @click="emit('update:visible', false)">
        취소
      </BButton>
      <BButton color="primary" :disabled="!cCanSave" :loading="cSaving" @click="onSave">
        {{ ctg ? '수정' : '추가' }}
      </BButton>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

import {
  useExpenseCtgCreateMutation,
  useExpenseCtgUpdateMutation,
} from '@/queries/expenseCtgsQuery'
import type { ExpenseCategory } from '@/types/expense'
import { buildExpenseCtgTree } from '@/utils/expenseCtgTree'

const props = defineProps<{
  visible: boolean
  /** null 이면 추가 모드. */
  ctg: ExpenseCategory | null
  /** 추가 모드의 기본 상위 — "하위 추가" 버튼에서 전달. */
  defaultParentSeq?: number | null
  /** 전체 카테고리 — 상위 선택지 구성용. */
  ctgs: readonly ExpenseCategory[]
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
}>()

const nm = ref('')
/** TreeSelect 선택 상태 — { [seq]: true } 형태. 비어 있으면 최상위. */
const selParentKeys = ref<Record<string, boolean> | null>(null)

const cParentSeq = computed(() => {
  const key = Object.keys(selParentKeys.value ?? {})[0]
  return key ? Number(key) : null
})

// 다이얼로그 열릴 때마다 초기화
watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    nm.value = props.ctg?.nm ?? ''
    const parentSeq = props.ctg ? props.ctg.parentSeq : (props.defaultParentSeq ?? null)
    selParentKeys.value = parentSeq != null ? { [parentSeq]: true } : null
  },
  { immediate: true },
)

/** 상위 선택지 — 수정 시 자기 자신과 하위는 제외 (자기 하위로 이동 불가). */
const cParentOptions = computed(() => buildExpenseCtgTree(props.ctgs, props.ctg?.seq))

const cCanSave = computed(() => nm.value.trim().length > 0)

const toast = useToast()
const { mutate: createCtg, isPending: isCreating } = useExpenseCtgCreateMutation()
const { mutate: updateCtg, isPending: isUpdating } = useExpenseCtgUpdateMutation()
const cSaving = computed(() => isCreating.value || isUpdating.value)

function onSave() {
  if (!cCanSave.value) return
  const payload = { parentSeq: cParentSeq.value, nm: nm.value.trim() }
  // 실패 시 글로벌 토스트가 backend 메시지 노출 — 다이얼로그는 열어둔다
  const onSuccess = () => {
    toast.add({
      severity: 'success',
      summary: props.ctg ? '카테고리 수정' : '카테고리 추가',
      life: 2000,
    })
    emit('update:visible', false)
  }
  if (props.ctg) {
    updateCtg({ seq: props.ctg.seq, payload }, { onSuccess })
  } else {
    createCtg(payload, { onSuccess })
  }
}
</script>
