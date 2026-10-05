<!-- 지출 카테고리 -->
<template>
  <div class="expense-ctgs-page flex h-full flex-col gap-3">
    <div class="flex items-center justify-between">
      <p class="text-sm text-surface-500">
        지출 카테고리를 계층으로 관리합니다. 하위 카테고리나 연결된 지출이 있으면 삭제할 수
        없습니다.
      </p>
      <BButton color="primary" size="sm" @click="onAdd(null)">
        <Plus :size="14" />
        카테고리 추가
      </BButton>
    </div>

    <TreeTable
      v-model:expanded-keys="expandedKeys"
      :value="cTree"
      :loading="isLoading"
      scrollable
      scroll-height="flex"
      :pt="{ thead: { class: 'bg-surface-50' } }"
    >
      <Column field="nm" header="카테고리" expander>
        <template #body="{ node }">
          <span class="font-semibold text-surface-900">{{ node.data.nm }}</span>
        </template>
      </Column>

      <Column header="작업" :pt="{ headerCell: { style: 'width:10rem' } }">
        <template #body="{ node }">
          <div class="flex gap-1">
            <BButton
              v-tooltip="'하위 카테고리 추가'"
              variant="outlined"
              color="secondary"
              size="sm"
              @click="onAdd(node.data.seq)"
            >
              <Plus :size="14" />
            </BButton>
            <BButton
              v-tooltip="'이름 변경 / 이동'"
              variant="outlined"
              color="secondary"
              size="sm"
              @click="onEdit(node.data)"
            >
              <Pencil :size="14" />
            </BButton>
            <BButton variant="outlined" color="danger" size="sm" @click="onRemove(node.data)">
              <Trash2 :size="14" />
            </BButton>
          </div>
        </template>
      </Column>

      <template #empty>
        <div class="py-8 text-center text-sm text-surface-500">
          등록된 카테고리가 없습니다.
        </div>
      </template>
    </TreeTable>

    <ExpenseCtgEditDialog
      v-model:visible="dialogVisible"
      :ctg="editing"
      :default-parent-seq="defaultParentSeq"
      :ctgs="ctgs ?? []"
    />
  </div>
</template>

<script setup lang="ts">
import { vTooltip } from 'floating-vue'
import { Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import ExpenseCtgEditDialog from '@/components/dialog/ExpenseCtgEditDialog.vue'
import { useExpenseCtgRemoveMutation, useExpenseCtgsQuery } from '@/queries/expenseCtgsQuery'
import type { ExpenseCategory } from '@/types/expense'
import { buildExpenseCtgTree, expandAllKeys, expenseCtgFullNm } from '@/utils/expenseCtgTree'

const { data: ctgs, isLoading } = useExpenseCtgsQuery()
const { mutate: removeCtg } = useExpenseCtgRemoveMutation()

const cTree = computed(() => buildExpenseCtgTree(ctgs.value ?? []))

/** 기본 전체 펼침 — 목록이 바뀌면(추가/이동) 다시 펼친다. */
const expandedKeys = ref<Record<string, boolean>>({})
watch(ctgs, (list) => (expandedKeys.value = expandAllKeys(list ?? [])), { immediate: true })

const confirm = useConfirm()
const toast = useToast()

const dialogVisible = ref(false)
/** 수정 대상. null 이면 추가 모드. */
const editing = ref<ExpenseCategory | null>(null)
/** 추가 모드의 기본 상위. */
const defaultParentSeq = ref<number | null>(null)

function onAdd(parentSeq: number | null) {
  editing.value = null
  defaultParentSeq.value = parentSeq
  dialogVisible.value = true
}

function onEdit(ctg: ExpenseCategory) {
  editing.value = ctg
  dialogVisible.value = true
}

function onRemove(ctg: ExpenseCategory) {
  confirm.require({
    message: `'${expenseCtgFullNm(ctgs.value ?? [], ctg.seq)}' 카테고리를 삭제합니다.`,
    header: '카테고리 삭제',
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { severity: 'danger' },
    accept: () =>
      removeCtg(ctg.seq, {
        onSuccess: () => toast.add({ severity: 'success', summary: '카테고리 삭제', life: 2000 }),
      }),
  })
}
</script>
