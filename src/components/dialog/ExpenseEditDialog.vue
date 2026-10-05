<!-- 지출 등록/수정 다이얼로그 — expense null 이면 등록. 같은 일자·매장 기존 지출이 있으면 불러와서 수정 -->
<template>
  <Dialog
    :visible="visible"
    modal
    :header="editing ? '지출 수정' : '지출 등록'"
    :style="{ width: '520px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-4">
      <div class="flex gap-3">
        <div class="flex flex-1 flex-col gap-1.5">
          <label class="text-sm font-semibold text-surface-900">
            지출일자 <span class="text-red-500">*</span>
          </label>
          <DatePicker
            v-model="cExpenseDate"
            date-format="yy-mm-dd"
            show-icon
            :max-date="cToday"
            class="w-full"
          />
        </div>
        <div class="flex flex-1 flex-col gap-1.5">
          <label class="text-sm font-semibold text-surface-900">
            매장 <span class="text-xs font-normal text-surface-500">(선택)</span>
          </label>
          <Select
            v-model="form.storeSeq"
            :options="stores ?? []"
            option-label="nm"
            option-value="seq"
            placeholder="구입처 — 없으면 비움"
            filter
            show-clear
            class="w-full"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          카테고리 <span class="text-red-500">*</span>
        </label>
        <TreeSelect
          v-model="cCtgKeys"
          :options="cCtgTree"
          selection-mode="single"
          placeholder="카테고리 선택"
          class="w-full"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          지출명 <span class="text-red-500">*</span>
        </label>
        <AutoComplete
          v-model="form.nm"
          :suggestions="nmSuggestions"
          dropdown
          :show-empty-message="false"
          placeholder="예: 전기요금, 채소"
          class="w-full"
          input-class="w-full"
          maxlength="50"
          @complete="onSearchNm"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          금액 <span class="text-red-500">*</span>
        </label>
        <InputGroup>
          <InputNumber
            v-model="form.amount"
            :min="0"
            placeholder="0"
            :input-class="'text-right'"
            @input="(e) => (form.amount = e.value as number | null)"
          />
          <InputGroupAddon>원</InputGroupAddon>
        </InputGroup>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          비고 <span class="text-xs font-normal text-surface-500">(선택)</span>
        </label>
        <Textarea v-model="cCmt" rows="2" maxlength="400" class="resize-none" />
      </div>
    </div>

    <template #footer>
      <BButton variant="outlined" color="secondary" @click="emit('update:visible', false)">
        취소
      </BButton>
      <BButton color="primary" :disabled="!cCanSave" :loading="cSaving" @click="onSave">
        {{ editing ? '수정' : '등록' }}
      </BButton>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { format, parse } from 'date-fns'
import type { AutoCompleteCompleteEvent } from 'primevue/autocomplete'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import * as expensesApi from '@/apis/expensesApi'
import { useExpenseCtgsQuery } from '@/queries/expenseCtgsQuery'
import {
  useExpenseCreateMutation,
  useExpenseNamesQuery,
  useExpenseUpdateMutation,
} from '@/queries/expensesQuery'
import { useStoresQuery } from '@/queries/storesQuery'
import type { Expense } from '@/types/expense'
import { buildExpenseCtgTree } from '@/utils/expenseCtgTree'

const props = defineProps<{
  visible: boolean
  /** null 이면 등록 모드. */
  expense: Expense | null
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
}>()

const { data: ctgs } = useExpenseCtgsQuery()
const { data: stores } = useStoresQuery(true)

/** 수정 대상 — 등록 중 같은 일자·매장 지출을 불러오면 그 지출로 바뀐다. */
const editing = ref<Expense | null>(null)

/**
 * amount — InputNumber 는 v-model 이 blur 시에만 갱신되므로 @input 으로 타이핑 중 값도 반영
 * (안 하면 입력 직후 저장 버튼이 비활성으로 남고, 비활성 버튼 클릭은 blur 를 일으키지 않는다).
 */
const form = reactive({
  expenseDt: '',
  storeSeq: null as number | null,
  ctgSeq: null as number | null,
  nm: '',
  amount: null as number | null,
  cmt: '',
})

const today = () => format(new Date(), 'yyyy-MM-dd')

/** 폼 채우기 중에는 기존 지출 조회(watch)를 건너뛴다. */
let hydrating = false
function hydrate(e: Expense | null) {
  hydrating = true
  editing.value = e
  Object.assign(form, {
    expenseDt: e?.expenseDt ?? today(),
    storeSeq: e?.storeSeq ?? null,
    ctgSeq: e?.ctgSeq ?? null,
    nm: e?.nm ?? '',
    amount: e?.amount ?? null,
    cmt: e?.cmt ?? '',
  })
  void nextTick(() => (hydrating = false))
}

watch(
  () => props.visible,
  (visible) => visible && hydrate(props.expense),
  { immediate: true },
)

// --- 같은 일자 + 같은 매장 기존 지출 → 불러오기 제안 ---
const confirm = useConfirm()
watch(
  () => [form.expenseDt, form.storeSeq] as const,
  async ([dt, storeSeq]) => {
    if (hydrating || !dt || storeSeq == null) return
    const found = await expensesApi.lookup(dt, storeSeq)
    if (!found || found.seq === editing.value?.seq) return
    const storeNm = stores.value?.find((s) => s.seq === storeSeq)?.nm ?? ''
    confirm.require({
      header: '기존 지출',
      message: `${dt} '${storeNm}' 지출이 이미 있습니다.\n불러와서 수정할까요?`,
      acceptLabel: '불러오기',
      rejectLabel: '다른 매장 선택',
      rejectProps: { severity: 'secondary', outlined: true },
      accept: () => hydrate(found),
      reject: () => (form.storeSeq = null),
    })
  },
)

// --- 입력 어댑터 ---
const cToday = computed(() => new Date())

const cExpenseDate = computed<Date | null>({
  get: () => (form.expenseDt ? parse(form.expenseDt, 'yyyy-MM-dd', new Date()) : null),
  set: (v) => (form.expenseDt = v instanceof Date ? format(v, 'yyyy-MM-dd') : ''),
})

const cCtgTree = computed(() => buildExpenseCtgTree(ctgs.value ?? []))
/** TreeSelect 선택 상태 — { [seq]: true }. */
const cCtgKeys = computed<Record<string, boolean> | null>({
  get: () => (form.ctgSeq != null ? { [form.ctgSeq]: true } : null),
  set: (v) => {
    const key = Object.keys(v ?? {})[0]
    form.ctgSeq = key ? Number(key) : null
  },
})

const cCmt = computed({
  get: () => form.cmt,
  set: (v: string | undefined) => (form.cmt = v ?? ''),
})

// --- 지출명 추천 — 선택한 카테고리에서 쓴 이름 ---
const { data: names } = useExpenseNamesQuery(() => form.ctgSeq)
const nmSuggestions = ref<string[]>([])
function onSearchNm(e: AutoCompleteCompleteEvent) {
  const q = e.query.trim()
  const list = names.value ?? []
  nmSuggestions.value = q ? list.filter((nm) => nm.includes(q)) : list
}

// --- 저장 ---
const cCanSave = computed(
  () =>
    !!form.expenseDt &&
    form.ctgSeq != null &&
    form.nm.trim().length > 0 &&
    form.amount != null &&
    form.amount > 0,
)

const toast = useToast()
const { mutate: createExpense, isPending: isCreating } = useExpenseCreateMutation()
const { mutate: updateExpense, isPending: isUpdating } = useExpenseUpdateMutation()
const cSaving = computed(() => isCreating.value || isUpdating.value)

function onSave() {
  if (!cCanSave.value || form.ctgSeq == null || form.amount == null) return
  const payload = {
    ctgSeq: form.ctgSeq,
    storeSeq: form.storeSeq,
    nm: form.nm.trim(),
    amount: form.amount,
    expenseDt: form.expenseDt,
    cmt: form.cmt.trim() || null,
  }
  // 실패 시 글로벌 토스트가 backend 메시지 노출 — 다이얼로그는 열어둔다
  const onSuccess = () => {
    toast.add({
      severity: 'success',
      summary: editing.value ? '지출 수정' : '지출 등록',
      life: 2000,
    })
    emit('update:visible', false)
  }
  if (editing.value) {
    updateExpense({ seq: editing.value.seq, payload }, { onSuccess })
  } else {
    createExpense(payload, { onSuccess })
  }
}
</script>
