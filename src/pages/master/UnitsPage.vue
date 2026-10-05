<!-- 단위 -->
<template>
  <div class="units-page flex h-full flex-col gap-3">
    <div class="flex items-center justify-between">
      <p class="text-sm text-surface-500">
        제품의 단위를 관리합니다. 사용 중인 단위나 다른 단위의 기준 단위는 삭제할 수 없습니다.
      </p>
      <BButton color="primary" size="sm" @click="onAdd">
        <Plus :size="14" />
        단위 추가
      </BButton>
    </div>

    <DataTable
      :value="units ?? []"
      :loading="isLoading"
      data-key="seq"
      striped-rows
      scrollable
      scroll-height="flex"
      :pt="{ thead: { class: 'bg-surface-50' } }"
    >
      <Column field="nm" header="단위">
        <template #body="{ data }">
          <span class="font-semibold text-surface-900">{{ data.nm }}</span>
        </template>
      </Column>

      <Column field="isUnitCnt" header="단위수량">
        <template #body="{ data }">
          <Check v-if="data.isUnitCnt" :size="16" class="text-primary-600" />
          <span v-else class="text-surface-400">—</span>
        </template>
      </Column>

      <Column header="기준 단위 환산">
        <template #body="{ data }">
          <span v-if="data.baseUnitSeq != null" class="text-sm text-surface-700">
            1 {{ data.nm }} = {{ data.baseFactor }} {{ unitNm(data.baseUnitSeq) }}
          </span>
          <span v-else class="text-surface-400">—</span>
        </template>
      </Column>

      <Column header="작업" :pt="{ headerCell: { style: 'width:7rem' } }">
        <template #body="{ data }">
          <div class="flex gap-1">
            <BButton variant="outlined" color="secondary" size="sm" @click="onEdit(data)">
              <Pencil :size="14" />
            </BButton>
            <BButton variant="outlined" color="danger" size="sm" @click="onRemove(data)">
              <Trash2 :size="14" />
            </BButton>
          </div>
        </template>
      </Column>

      <template #empty>
        <div class="py-8 text-center text-sm text-surface-500">등록된 단위가 없습니다.</div>
      </template>
    </DataTable>

    <UnitEditDialog v-model:visible="dialogVisible" :unit="editing" :units="units ?? []" />
  </div>
</template>

<script setup lang="ts">
import { Check, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import UnitEditDialog from '@/components/dialog/UnitEditDialog.vue'
import { useUnitRemoveMutation, useUnitsQuery } from '@/queries/unitsQuery'
import type { Unit } from '@/types/product'

const { data: units, isLoading } = useUnitsQuery()
const { mutate: removeUnit } = useUnitRemoveMutation()

const confirm = useConfirm()
const toast = useToast()

const dialogVisible = ref(false)
/** 수정 대상. null 이면 추가 모드. */
const editing = ref<Unit | null>(null)

function unitNm(seq: number) {
  return units.value?.find((u) => u.seq === seq)?.nm ?? ''
}

function onAdd() {
  editing.value = null
  dialogVisible.value = true
}

function onEdit(unit: Unit) {
  editing.value = unit
  dialogVisible.value = true
}

function onRemove(unit: Unit) {
  confirm.require({
    message: `'${unit.nm}' 단위를 삭제합니다.`,
    header: '단위 삭제',
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { severity: 'danger' },
    accept: () =>
      removeUnit(unit.seq, {
        onSuccess: () => toast.add({ severity: 'success', summary: '단위 삭제', life: 2000 }),
      }),
  })
}
</script>
