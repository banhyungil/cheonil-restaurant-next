<!-- 지출내역 -->
<template>
  <section class="expenses-page flex h-full flex-col gap-4 px-8 py-6">
    <header class="flex h-10 items-center gap-3">
      <h1 class="text-2xl font-bold text-surface-900">{{ route.meta.nav?.label }}</h1>
      <BButton color="primary" class="ml-auto" @click="onAdd">
        <Plus :size="16" />
        지출 등록
      </BButton>
    </header>

    <!-- 필터 — [검색] 시에만 조회 -->
    <div class="flex flex-wrap items-center gap-2">
      <DateRangePicker v-model:from="draft.from" v-model:to="draft.to" class="w-72" />
      <TreeSelect
        v-model="cDraftCtgKeys"
        :options="cCtgTree"
        selection-mode="single"
        placeholder="카테고리 전체"
        show-clear
        class="w-52"
      />
      <Select
        v-model="draft.storeSeq"
        :options="cPurchaseStores"
        option-label="nm"
        option-value="seq"
        placeholder="매장 전체"
        filter
        show-clear
        class="w-44"
      />
      <BInputText
        v-model="draft.q"
        placeholder="지출명 검색"
        class="w-44"
        @keydown.enter="onSearch"
      />
      <BButton color="primary" :disabled="!cCanSearch" @click="onSearch">
        <Search :size="16" />
        검색
      </BButton>
    </div>

    <div class="flex items-baseline gap-3 text-sm text-surface-600">
      <span>{{ applied.from }} ~ {{ applied.to }}</span>
      <span>{{ cRows.length }}건</span>
      <span class="text-base font-bold text-surface-900">합계 {{ formatWon(cTotal) }}</span>
    </div>

    <DataTable
      :value="cRows"
      :loading="isFetching"
      data-key="seq"
      striped-rows
      paginator
      :rows="50"
      :rows-per-page-options="[20, 50, 100]"
      scrollable
      scroll-height="flex"
      class="min-h-0 flex-1"
      :pt="{ thead: { class: 'bg-surface-50' } }"
    >
      <Column field="expenseDt" header="지출일자" sortable class="w-32" />

      <Column header="카테고리" class="w-48">
        <template #body="{ data }">
          <span class="text-surface-700">{{ ctgNm(data.ctgSeq) }}</span>
        </template>
      </Column>

      <Column field="nm" header="지출명">
        <template #body="{ data }">
          <span class="font-semibold text-surface-900">{{ data.nm }}</span>
        </template>
      </Column>

      <Column header="매장" class="w-48">
        <template #body="{ data }">
          <span v-if="data.storeSeq != null" class="text-surface-700">
            {{ storeNm(data.storeSeq) }}
          </span>
          <span v-else class="text-surface-400">—</span>
        </template>
      </Column>

      <!-- 헤더 내용은 flex 라 text-right 가 안 먹음 → columnHeaderContent 를 justify-end 로 맞춤 -->
      <Column
        field="amount"
        header="금액"
        sortable
        class="w-36 text-right"
        :pt="{ columnHeaderContent: { class: 'justify-end' } }"
      >
        <template #body="{ data }">
          <span class="font-semibold text-surface-900">{{ formatWon(data.amount) }}</span>
        </template>
      </Column>

      <Column header="비고">
        <template #body="{ data }">
          <span class="line-clamp-1 text-sm text-surface-500">{{ data.cmt }}</span>
        </template>
      </Column>

      <Column header="작업" class="w-28">
        <template #body="{ data }">
          <div class="flex gap-1">
            <BButton
              variant="outlined"
              color="secondary"
              size="sm"
              aria-label="수정"
              @click="onEdit(data)"
            >
              <Pencil :size="14" />
            </BButton>
            <BButton
              variant="outlined"
              color="danger"
              size="sm"
              aria-label="삭제"
              @click="onRemove(data)"
            >
              <Trash2 :size="14" />
            </BButton>
          </div>
        </template>
      </Column>

      <template #empty>
        <div class="py-8 text-center text-sm text-surface-500">지출 내역이 없습니다.</div>
      </template>
    </DataTable>

    <ExpenseEditDialog v-model:visible="dialogVisible" :expense="editing" />
  </section>
</template>

<script setup lang="ts">
import { format, startOfMonth } from 'date-fns'
import _ from 'lodash'
import { Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import type { ExpensesParams } from '@/apis/expensesApi'
import ExpenseEditDialog from '@/components/dialog/ExpenseEditDialog.vue'
import { useExpenseCtgsQuery } from '@/queries/expenseCtgsQuery'
import { useExpenseRemoveMutation, useExpensesQuery } from '@/queries/expensesQuery'
import { useStoresQuery } from '@/queries/storesQuery'
import type { Expense } from '@/types/expense'
import { buildExpenseCtgTree, expenseCtgFullNm } from '@/utils/expenseCtgTree'
import { formatWon } from '@/utils/formatters'

const route = useRoute()
const confirm = useConfirm()
const toast = useToast()

const { data: ctgs } = useExpenseCtgsQuery()
const { data: stores } = useStoresQuery(true)
/** 구입처 필터 후보 — 구매처만. */
const cPurchaseStores = computed(() => (stores.value ?? []).filter((s) => s.isPurchase))

// --- 필터: draft(편집 중) → [검색] 시 applied 로 커밋. 기본 = 이번 달 1일 ~ 오늘 ---
interface Filter {
  from: string
  to: string
  ctgSeq: number | null
  storeSeq: number | null
  q: string
}
const now = new Date()
const draft = reactive<Filter>({
  from: format(startOfMonth(now), 'yyyy-MM-dd'),
  to: format(now, 'yyyy-MM-dd'),
  ctgSeq: null,
  storeSeq: null,
  q: '',
})
const applied = ref<Filter>({ ...draft })

const cCanSearch = computed(() => !!draft.from && !!draft.to)
function onSearch() {
  if (cCanSearch.value) applied.value = { ...draft }
}

const cParams = computed<ExpensesParams>(() => ({
  from: applied.value.from,
  to: applied.value.to,
  ctgSeq: applied.value.ctgSeq ?? undefined,
  storeSeq: applied.value.storeSeq ?? undefined,
  q: applied.value.q.trim() || undefined,
}))
const { data: expenses, isFetching } = useExpensesQuery(cParams)

const cRows = computed(() => expenses.value ?? [])
const cTotal = computed(() => _.sumBy(cRows.value, 'amount'))

// --- 카테고리 / 매장 표시 ---
const cCtgTree = computed(() => buildExpenseCtgTree(ctgs.value ?? []))
const cDraftCtgKeys = computed<Record<string, boolean> | null>({
  get: () => (draft.ctgSeq != null ? { [draft.ctgSeq]: true } : null),
  set: (v) => {
    const key = Object.keys(v ?? {})[0]
    draft.ctgSeq = key ? Number(key) : null
  },
})

function ctgNm(seq: number) {
  return expenseCtgFullNm(ctgs.value ?? [], seq)
}
function storeNm(seq: number) {
  return stores.value?.find((s) => s.seq === seq)?.nm ?? ''
}

// --- 등록 / 수정 / 삭제 ---
const { mutate: removeExpense } = useExpenseRemoveMutation()
const dialogVisible = ref(false)
/** 수정 대상. null 이면 등록 모드. */
const editing = ref<Expense | null>(null)

function onAdd() {
  editing.value = null
  dialogVisible.value = true
}

function onEdit(expense: Expense) {
  editing.value = expense
  dialogVisible.value = true
}

function onRemove(expense: Expense) {
  confirm.require({
    message: `${expense.expenseDt} '${expense.nm}' (${formatWon(expense.amount)}) 지출을 삭제합니다.`,
    header: '지출 삭제',
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { severity: 'danger' },
    accept: () =>
      removeExpense(expense.seq, {
        onSuccess: () => toast.add({ severity: 'success', summary: '지출 삭제', life: 2000 }),
      }),
  })
}
</script>
