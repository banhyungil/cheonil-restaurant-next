<!-- 지출 등록/수정 다이얼로그 — expense null 이면 등록. 같은 일자·매장 기존 지출이 있으면 불러와서 수정 -->
<template>
  <Dialog
    :visible="visible"
    modal
    :header="editing ? '지출 수정' : '지출 등록'"
    :style="{ width: '760px' }"
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
            @input="onAmountInput"
          />
          <InputGroupAddon>원</InputGroupAddon>
        </InputGroup>
        <p
          v-if="lines.length > 0 && form.amount !== cLinesTotal"
          class="flex items-center gap-2 text-xs text-surface-500"
        >
          품목 합계 {{ formatWon(cLinesTotal) }}와 다릅니다 (배송비·할인 등).
          <button type="button" class="text-primary-600 underline" @click="syncAmount">
            합계로 맞추기
          </button>
        </p>
      </div>

      <!-- 구입목록 — 선택 입력. 금액은 품목 합계로 자동 채움 -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <label class="text-sm font-semibold text-surface-900">
            구입목록 <span class="text-xs font-normal text-surface-500">(선택)</span>
          </label>
          <BButton variant="outlined" color="secondary" size="sm" @click="pickerVisible = true">
            <Plus :size="14" />
            제품 추가
          </BButton>
        </div>
        <table v-if="lines.length > 0" class="expense-lines w-full text-sm">
          <thead class="bg-surface-50 text-surface-600">
            <tr>
              <th class="px-2 py-1.5 text-left font-medium">제품</th>
              <th class="px-2 py-1.5 text-left font-medium">규격</th>
              <th class="px-2 py-1.5 text-left font-medium">수량</th>
              <th class="px-2 py-1.5 text-left font-medium">단가</th>
              <th class="px-2 py-1.5 text-right font-medium">금액</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(line, i) in lines" :key="i" class="border-b border-surface-100">
              <td class="px-2 py-1.5 font-semibold text-surface-900">
                {{ productOf(line.prdSeq)?.nm }}
              </td>
              <td class="px-2 py-1.5">
                <InputGroup v-if="isUnitCnt(line.prdSeq)" class="w-32">
                  <InputNumber
                    v-model="line.unitCnt"
                    :min="0"
                    :max="9999.99"
                    :max-fraction-digits="2"
                    :input-class="'w-full text-right'"
                    :aria-label="`${productOf(line.prdSeq)?.nm} 규격`"
                    @input="(e) => (line.unitCnt = e.value as number | null)"
                  />
                  <InputGroupAddon>{{ productOf(line.prdSeq)?.unitNm }}</InputGroupAddon>
                </InputGroup>
                <span v-else class="text-surface-500">{{ productOf(line.prdSeq)?.unitNm }}</span>
              </td>
              <td class="px-2 py-1.5">
                <InputNumber
                  v-model="line.cnt"
                  show-buttons
                  button-layout="horizontal"
                  :min="1"
                  :max="32767"
                  :input-class="'w-12 text-center'"
                  :aria-label="`${productOf(line.prdSeq)?.nm} 수량`"
                  @input="(e) => (line.cnt = (e.value as number | null) ?? 1)"
                />
              </td>
              <td class="px-2 py-1.5">
                <InputGroup class="w-36">
                  <InputNumber
                    v-model="line.price"
                    :min="0"
                    :input-class="'w-full text-right'"
                    :aria-label="`${productOf(line.prdSeq)?.nm} 단가`"
                    placeholder="단가"
                    @input="(e) => (line.price = e.value as number | null)"
                  />
                  <InputGroupAddon>원</InputGroupAddon>
                </InputGroup>
              </td>
              <td class="px-2 py-1.5 text-right font-semibold text-surface-900">
                {{ formatWon(line.cnt * (line.price ?? 0)) }}
              </td>
              <td class="px-2 py-1.5 text-right">
                <BButton
                  variant="outlined"
                  color="danger"
                  size="sm"
                  aria-label="품목 삭제"
                  @click="lines.splice(i, 1)"
                >
                  <Trash2 :size="14" />
                </BButton>
              </td>
            </tr>
          </tbody>
        </table>
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
    <ProductPickerDialog
      v-model:visible="pickerVisible"
      :counts="cLineCounts"
      @pick="onPickProduct"
    />
  </Dialog>
</template>

<script setup lang="ts">
import { format, parse } from 'date-fns'
import _ from 'lodash'
import { Plus, Trash2 } from 'lucide-vue-next'
import type { AutoCompleteCompleteEvent } from 'primevue/autocomplete'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import * as expensesApi from '@/apis/expensesApi'
import type { ExpenseProductPayload } from '@/apis/expensesApi'
import ProductPickerDialog from '@/components/dialog/ProductPickerDialog.vue'
import { useExpenseCtgsQuery } from '@/queries/expenseCtgsQuery'
import {
  useExpenseCreateMutation,
  useExpenseNamesQuery,
  useExpenseUpdateMutation,
} from '@/queries/expensesQuery'
import { useProductsQuery } from '@/queries/productsQuery'
import { useStoresQuery } from '@/queries/storesQuery'
import { useUnitsQuery } from '@/queries/unitsQuery'
import type { Expense } from '@/types/expense'
import type { Product } from '@/types/product'
import { buildExpenseCtgTree } from '@/utils/expenseCtgTree'
import { formatWon } from '@/utils/formatters'

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
const { data: products } = useProductsQuery()
const { data: units } = useUnitsQuery()

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

// --- 구입목록 ---
/** 구입목록 줄 — 같은 (제품, 규격) 은 클릭 시 수량 증가, 저장 시 한 줄로 합친다. */
/**
 * 단가는 비워둔 채 시작한다 — 0 으로 채우면 입력칸의 0 뒤에 숫자가 붙어 12000 이 120000 이 된다.
 * 저장 전 모든 줄의 단가 입력을 요구한다.
 */
type LineDraft = Omit<ExpenseProductPayload, 'price'> & { price: number | null }
const lines = ref<LineDraft[]>([])
const pickerVisible = ref(false)

const lineKey = (prdSeq: number, unitCnt: number | null) => `${prdSeq}:${unitCnt ?? ''}`
const cLinesTotal = computed(() => _.sumBy(lines.value, (l) => l.cnt * (l.price ?? 0)))
const cLineCounts = computed(() =>
  _.mapValues(
    _.groupBy(lines.value, (l) => lineKey(l.prdSeq, l.unitCnt)),
    (ls) => _.sumBy(ls, 'cnt'),
  ),
)

function productOf(prdSeq: number) {
  return products.value?.find((p) => p.seq === prdSeq)
}
function isUnitCnt(prdSeq: number) {
  const unitSeq = productOf(prdSeq)?.unitSeq
  return units.value?.find((u) => u.seq === unitSeq)?.isUnitCnt ?? false
}

function onPickProduct(product: Product, unitCnt: number | null) {
  const same = lines.value.find(
    (l) => lineKey(l.prdSeq, l.unitCnt) === lineKey(product.seq, unitCnt),
  )
  if (same) same.cnt++
  else lines.value.push({ prdSeq: product.seq, cnt: 1, price: null, unitCnt, cmt: null })
}

// --- 금액 — 품목이 있으면 품목 합계로 자동 채움. 사용자가 직접 고치면 그 값을 유지 ---
const amountManual = ref(false)
function onAmountInput(e: { value: unknown }) {
  form.amount = e.value as number | null
  amountManual.value = true
}
function syncAmount() {
  form.amount = cLinesTotal.value
  amountManual.value = false
}
watch(cLinesTotal, (total) => {
  if (lines.value.length > 0 && !amountManual.value) form.amount = total
})

/** 저장용 품목 — 같은 (제품, 규격) 줄은 합친다. 단가가 다르면 합칠 수 없어 null. */
function mergedLines(): ExpenseProductPayload[] | null {
  const groups = _.groupBy(lines.value, (l) => lineKey(l.prdSeq, l.unitCnt))
  const merged: ExpenseProductPayload[] = []
  for (const ls of Object.values(groups)) {
    if (_.uniqBy(ls, 'price').length > 1) return null
    merged.push({ ...ls[0]!, price: ls[0]!.price ?? 0, cnt: _.sumBy(ls, 'cnt') })
  }
  return merged
}

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
  lines.value = (e?.products ?? []).map(({ prdSeq, cnt, price, unitCnt, cmt }) => ({
    prdSeq,
    cnt,
    price,
    unitCnt,
    cmt,
  }))
  // 기존 지출의 금액이 품목 합계와 다르면 사용자가 직접 정한 금액 — 자동 채움으로 덮어쓰지 않는다
  amountManual.value = lines.value.length > 0 && form.amount !== cLinesTotal.value
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
    form.amount > 0 &&
    lines.value.every((l) => l.price != null),
)

const toast = useToast()
const { mutate: createExpense, isPending: isCreating } = useExpenseCreateMutation()
const { mutate: updateExpense, isPending: isUpdating } = useExpenseUpdateMutation()
const cSaving = computed(() => isCreating.value || isUpdating.value)

function onSave() {
  if (!cCanSave.value || form.ctgSeq == null || form.amount == null) return
  const products = mergedLines()
  if (!products) {
    toast.add({
      severity: 'warn',
      summary: '같은 제품·규격이 단가가 다른 채로 두 줄 있습니다',
      detail: '한 줄로 정리해주세요.',
      life: 3000,
    })
    return
  }
  const payload = {
    ctgSeq: form.ctgSeq,
    storeSeq: form.storeSeq,
    nm: form.nm.trim(),
    amount: form.amount,
    expenseDt: form.expenseDt,
    cmt: form.cmt.trim() || null,
    products,
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
