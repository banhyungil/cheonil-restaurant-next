<!-- 제품 관리 -->
<template>
  <section class="products-page flex h-full flex-col gap-5 px-8 py-6">
    <header class="flex h-10 items-center gap-3">
      <h1 class="text-2xl font-bold text-surface-900">{{ route.meta.nav?.label }}</h1>
      <IconField class="ml-4 w-64">
        <InputIcon><Search :size="16" /></InputIcon>
        <BInputText v-model="keyword" placeholder="식자재 / 제품명 검색" class="w-full" />
      </IconField>
      <BButton color="primary" class="ml-auto" @click="onAdd">
        <Plus :size="16" />
        제품 등록
      </BButton>
    </header>

    <div class="min-h-0 flex-1">
      <DataTable
        :value="cRows"
        :loading="isLoading"
        data-key="seq"
        striped-rows
        scrollable
        scroll-height="flex"
        :pt="{ thead: { class: 'bg-surface-50' } }"
      >
        <Column field="ingdNm" header="식자재" sortable>
          <template #body="{ data }">
            <span class="text-surface-700">{{ data.ingdNm }}</span>
          </template>
        </Column>

        <Column field="nm" header="제품명" sortable>
          <template #body="{ data }">
            <span class="font-semibold text-surface-900">{{ data.nm }}</span>
          </template>
        </Column>

        <Column field="unitNm" header="단위">
          <template #body="{ data }">
            <span class="text-surface-700">{{ data.unitNm }}</span>
          </template>
        </Column>

        <Column header="규격">
          <template #body="{ data }">
            <div v-if="data.unitCnts.length > 0" class="flex flex-wrap gap-1">
              <Tag
                v-for="cnt in data.unitCnts"
                :key="cnt"
                :value="formatUnitCnt(cnt, data.unitNm)"
                severity="secondary"
              />
            </div>
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
          <div class="py-8 text-center text-sm text-surface-500">
            {{ keyword ? '검색 결과가 없습니다.' : '등록된 제품이 없습니다.' }}
          </div>
        </template>
      </DataTable>
    </div>

    <ProductEditDialog v-model:visible="dialogVisible" :product="editing" />
  </section>
</template>

<script setup lang="ts">
import { Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import ProductEditDialog from '@/components/dialog/ProductEditDialog.vue'
import { useProductRemoveMutation, useProductsQuery } from '@/queries/productsQuery'
import type { Product } from '@/types/product'
import { formatUnitCnt } from '@/utils/formatters'

const route = useRoute()
const confirm = useConfirm()
const toast = useToast()

const { data: products, isLoading } = useProductsQuery()
const { mutate: removeProduct } = useProductRemoveMutation()

const keyword = ref('')
const cRows = computed(() => {
  const q = keyword.value.trim()
  const list = products.value ?? []
  return q ? list.filter((p) => p.ingdNm.includes(q) || p.nm.includes(q)) : list
})

const dialogVisible = ref(false)
/** 수정 대상. null 이면 추가 모드. */
const editing = ref<Product | null>(null)

function onAdd() {
  editing.value = null
  dialogVisible.value = true
}

function onEdit(product: Product) {
  editing.value = product
  dialogVisible.value = true
}

function onRemove(product: Product) {
  confirm.require({
    message: `'${product.nm} (${product.unitNm})' 제품을 삭제합니다.`,
    header: '제품 삭제',
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { severity: 'danger' },
    accept: () =>
      removeProduct(product.seq, {
        onSuccess: () => toast.add({ severity: 'success', summary: '제품 삭제', life: 2000 }),
      }),
  })
}
</script>
