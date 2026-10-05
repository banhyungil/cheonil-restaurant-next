<!-- 제품 편집 다이얼로그 — product null 이면 추가, 있으면 수정 -->
<template>
  <Dialog
    :visible="visible"
    modal
    :header="product ? '제품 수정' : '제품 등록'"
    :style="{ width: '480px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          식자재 <span class="text-red-500">*</span>
        </label>
        <AutoComplete
          v-model="form.ingdNm"
          :suggestions="ingdSuggestions"
          dropdown
          :show-empty-message="false"
          placeholder="예: 쌀, 대파"
          class="w-full"
          input-class="w-full"
          @complete="onSearchIngd"
        />
        <p class="text-xs text-surface-500">
          <template v-if="cIsNewIngd">'{{ form.ingdNm.trim() }}' 식자재가 새로 등록됩니다.</template>
          <template v-else>같은 식자재의 제품끼리 가격을 비교합니다.</template>
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          제품명 <span class="text-red-500">*</span>
        </label>
        <BInputText v-model="form.nm" placeholder="예: 오뚜기 알뜰당면" maxlength="100" />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          단위 <span class="text-red-500">*</span>
        </label>
        <div class="flex gap-2">
          <Select
            v-model="form.unitSeq"
            :options="units ?? []"
            option-label="nm"
            option-value="seq"
            placeholder="단위 선택"
            class="flex-1"
          />
          <BButton
            v-tooltip="'단위 추가'"
            variant="outlined"
            color="secondary"
            @click="unitDialogVisible = true"
          >
            <Plus :size="16" />
          </BButton>
        </div>
      </div>

      <div v-if="cUnit?.isUnitCnt" class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          규격 <span class="text-xs font-normal text-surface-500">(선택)</span>
        </label>
        <div class="flex gap-2">
          <InputGroup class="flex-1">
            <InputNumber
              v-model="newUnitCnt"
              :min="0"
              :max="9999.99"
              :max-fraction-digits="2"
              placeholder="예: 600"
              :input-class="'text-right'"
              @input="(e) => (newUnitCnt = e.value as number | null)"
              @keydown.enter="onAddUnitCnt"
            />
            <InputGroupAddon>{{ cUnit.nm }}</InputGroupAddon>
          </InputGroup>
          <BButton
            variant="outlined"
            color="secondary"
            :disabled="!newUnitCnt"
            @click="onAddUnitCnt"
          >
            추가
          </BButton>
        </div>
        <div v-if="form.unitCnts.length > 0" class="flex flex-wrap gap-1.5">
          <Chip
            v-for="cnt in form.unitCnts"
            :key="cnt"
            :label="formatUnitCnt(cnt, cUnit.nm)"
            removable
            @remove="onRemoveUnitCnt(cnt)"
          />
        </div>
        <p class="text-xs text-surface-500">
          자주 사는 규격을 등록하면 지출 입력 시 바로 고를 수 있습니다.
        </p>
      </div>
    </div>

    <template #footer>
      <BButton variant="outlined" color="secondary" @click="emit('update:visible', false)">
        취소
      </BButton>
      <BButton color="primary" :disabled="!cCanSave" :loading="cSaving" @click="onSave">
        {{ product ? '수정' : '등록' }}
      </BButton>
    </template>

    <UnitEditDialog
      v-model:visible="unitDialogVisible"
      :unit="null"
      :units="units ?? []"
      @saved="(u) => (form.unitSeq = u.seq)"
    />
  </Dialog>
</template>

<script setup lang="ts">
import { vTooltip } from 'floating-vue'
import { Plus } from 'lucide-vue-next'
import type { AutoCompleteCompleteEvent } from 'primevue/autocomplete'
import { useToast } from 'primevue/usetoast'

import UnitEditDialog from '@/components/dialog/UnitEditDialog.vue'
import { useIngredientsQuery } from '@/queries/ingredientsQuery'
import { useProductCreateMutation, useProductUpdateMutation } from '@/queries/productsQuery'
import { useUnitsQuery } from '@/queries/unitsQuery'
import type { Product } from '@/types/product'
import { formatUnitCnt } from '@/utils/formatters'

const props = defineProps<{
  visible: boolean
  /** null 이면 추가 모드. */
  product: Product | null
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
}>()

const { data: ingredients } = useIngredientsQuery()
const { data: units } = useUnitsQuery()

const form = reactive({
  ingdNm: '',
  nm: '',
  unitSeq: null as number | null,
  unitCnts: [] as number[],
})
/** 규격 입력값 — InputNumber 는 v-model 이 blur 시에만 갱신되므로 @input 으로 타이핑 중 값도 반영 (Enter / 추가 버튼). */
const newUnitCnt = ref<number | null>(null)
const unitDialogVisible = ref(false)

// 다이얼로그 열릴 때마다 초기화 — 수정 모드면 기존 값으로 prefill
watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    const p = props.product
    Object.assign(form, {
      ingdNm: p?.ingdNm ?? '',
      nm: p?.nm ?? '',
      unitSeq: p?.unitSeq ?? null,
      unitCnts: [...(p?.unitCnts ?? [])],
    })
    newUnitCnt.value = null
  },
  { immediate: true },
)

// 제품명 기본값 = 식자재명. 사용자가 제품명을 따로 바꿨으면 덮어쓰지 않는다.
watch(
  () => form.ingdNm,
  (ingdNm, prev) => {
    if (form.nm === '' || form.nm === prev) form.nm = ingdNm
  },
)

const cUnit = computed(() => units.value?.find((u) => u.seq === form.unitSeq) ?? null)

const cIsNewIngd = computed(() => {
  const nm = form.ingdNm.trim()
  return nm.length > 0 && !ingredients.value?.some((i) => i.nm === nm)
})

// --- 식자재 자동완성 ---
const ingdSuggestions = ref<string[]>([])
function onSearchIngd(e: AutoCompleteCompleteEvent) {
  const q = e.query.trim()
  const names = (ingredients.value ?? []).map((i) => i.nm)
  ingdSuggestions.value = q ? names.filter((nm) => nm.includes(q)) : names
}

// --- 규격 칩 ---
function onAddUnitCnt() {
  const v = newUnitCnt.value
  if (!v || v <= 0) return
  if (!form.unitCnts.includes(v)) {
    form.unitCnts = [...form.unitCnts, v].sort((a, b) => a - b)
  }
  newUnitCnt.value = null
}

function onRemoveUnitCnt(cnt: number) {
  form.unitCnts = form.unitCnts.filter((c) => c !== cnt)
}

// --- 저장 ---
const cCanSave = computed(
  () => form.ingdNm.trim().length > 0 && form.nm.trim().length > 0 && form.unitSeq != null,
)

const toast = useToast()
const { mutate: createProduct, isPending: isCreating } = useProductCreateMutation()
const { mutate: updateProduct, isPending: isUpdating } = useProductUpdateMutation()
const cSaving = computed(() => isCreating.value || isUpdating.value)

function onSave() {
  if (!cCanSave.value || form.unitSeq == null) return
  const payload = {
    ingdNm: form.ingdNm.trim(),
    nm: form.nm.trim(),
    unitSeq: form.unitSeq,
    unitCnts: cUnit.value?.isUnitCnt ? form.unitCnts : [],
  }
  // 실패 시 글로벌 토스트가 backend 메시지 노출 — 다이얼로그는 열어둔다
  const onSuccess = () => {
    toast.add({ severity: 'success', summary: props.product ? '제품 수정' : '제품 등록', life: 2000 })
    emit('update:visible', false)
  }
  if (props.product) {
    updateProduct({ seq: props.product.seq, payload }, { onSuccess })
  } else {
    createProduct(payload, { onSuccess })
  }
}
</script>
