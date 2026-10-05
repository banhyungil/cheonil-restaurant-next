<!-- 식자재 편집 다이얼로그 — ingredient null 이면 추가, 있으면 이름 변경 -->
<template>
  <Dialog
    :visible="visible"
    modal
    :header="ingredient ? '식자재 수정' : '식자재 추가'"
    :style="{ width: '400px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-semibold text-surface-900">
        식자재명 <span class="text-red-500">*</span>
      </label>
      <BInputText v-model="nm" placeholder="예: 쌀, 대파" maxlength="100" />
    </div>

    <template #footer>
      <BButton variant="outlined" color="secondary" @click="emit('update:visible', false)">
        취소
      </BButton>
      <BButton color="primary" :disabled="!cCanSave" :loading="cSaving" @click="onSave">
        {{ ingredient ? '수정' : '추가' }}
      </BButton>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

import {
  useIngredientCreateMutation,
  useIngredientUpdateMutation,
} from '@/queries/ingredientsQuery'
import type { Ingredient } from '@/types/product'

const props = defineProps<{
  visible: boolean
  /** null 이면 추가 모드. */
  ingredient: Ingredient | null
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
}>()

const nm = ref('')

watch(
  () => props.visible,
  (visible) => {
    if (visible) nm.value = props.ingredient?.nm ?? ''
  },
  { immediate: true },
)

const cCanSave = computed(() => nm.value.trim().length > 0)

const toast = useToast()
const { mutate: createIngd, isPending: isCreating } = useIngredientCreateMutation()
const { mutate: updateIngd, isPending: isUpdating } = useIngredientUpdateMutation()
const cSaving = computed(() => isCreating.value || isUpdating.value)

function onSave() {
  if (!cCanSave.value) return
  const payload = { nm: nm.value.trim() }
  // 실패 시 글로벌 토스트가 backend 메시지 노출 — 다이얼로그는 열어둔다
  const onSuccess = () => {
    toast.add({
      severity: 'success',
      summary: props.ingredient ? '식자재 수정' : '식자재 추가',
      life: 2000,
    })
    emit('update:visible', false)
  }
  if (props.ingredient) {
    updateIngd({ seq: props.ingredient.seq, payload }, { onSuccess })
  } else {
    createIngd(payload, { onSuccess })
  }
}
</script>
