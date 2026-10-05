<!-- 식자재 -->
<template>
  <div class="ingredients-page flex h-full flex-col gap-3">
    <div class="flex items-center justify-between">
      <p class="text-sm text-surface-500">
        식자재는 제품 등록 시 자동으로 추가됩니다. 제품이 등록된 식자재는 삭제할 수 없습니다.
      </p>
      <BButton color="primary" size="sm" @click="onAdd">
        <Plus :size="14" />
        식자재 추가
      </BButton>
    </div>

    <DataTable
      :value="ingredients ?? []"
      :loading="isLoading"
      data-key="seq"
      striped-rows
      scrollable
      scroll-height="flex"
      :pt="{ thead: { class: 'bg-surface-50' } }"
    >
      <Column field="nm" header="식자재" sortable>
        <template #body="{ data }">
          <span class="font-semibold text-surface-900">{{ data.nm }}</span>
        </template>
      </Column>

      <Column field="productCnt" header="제품 수" sortable>
        <template #body="{ data }">
          <span v-if="data.productCnt > 0" class="text-surface-700">{{ data.productCnt }}</span>
          <span v-else class="text-surface-400">없음</span>
        </template>
      </Column>

      <Column header="작업" :pt="{ headerCell: { style: 'width:7rem' } }">
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
              :disabled="data.productCnt > 0"
              aria-label="삭제"
              @click="onRemove(data)"
            >
              <Trash2 :size="14" />
            </BButton>
          </div>
        </template>
      </Column>

      <template #empty>
        <div class="py-8 text-center text-sm text-surface-500">등록된 식자재가 없습니다.</div>
      </template>
    </DataTable>

    <IngredientEditDialog v-model:visible="dialogVisible" :ingredient="editing" />
  </div>
</template>

<script setup lang="ts">
import { Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import IngredientEditDialog from '@/components/dialog/IngredientEditDialog.vue'
import { useIngredientRemoveMutation, useIngredientsQuery } from '@/queries/ingredientsQuery'
import type { Ingredient } from '@/types/product'

const { data: ingredients, isLoading } = useIngredientsQuery()
const { mutate: removeIngd } = useIngredientRemoveMutation()

const confirm = useConfirm()
const toast = useToast()

const dialogVisible = ref(false)
/** 수정 대상. null 이면 추가 모드. */
const editing = ref<Ingredient | null>(null)

function onAdd() {
  editing.value = null
  dialogVisible.value = true
}

function onEdit(ingd: Ingredient) {
  editing.value = ingd
  dialogVisible.value = true
}

function onRemove(ingd: Ingredient) {
  confirm.require({
    message: `'${ingd.nm}' 식자재를 삭제합니다.`,
    header: '식자재 삭제',
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { severity: 'danger' },
    accept: () =>
      removeIngd(ingd.seq, {
        onSuccess: () => toast.add({ severity: 'success', summary: '식자재 삭제', life: 2000 }),
      }),
  })
}
</script>
