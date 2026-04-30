<!-- 매장 관리 -->
<template>
  <section class="stores-page flex h-full flex-col gap-5 px-8 py-6">
    <!-- 헤더 -->
    <header class="flex h-10 items-center gap-3">
      <h1 class="text-2xl font-bold text-surface-900">매장 관리</h1>
      <div class="flex-1" />
      <IconField class="w-60">
        <InputIcon class="text-surface-500">
          <Search :size="16" />
        </InputIcon>
        <InputText
          v-model="searchKeyword"
          placeholder="매장 검색"
          class="h-10 w-full"
          @keydown.esc="searchKeyword = ''"
        />
      </IconField>
      <BButton color="primary" @click="onAdd">
        <Plus :size="16" />
        매장 추가
      </BButton>
    </header>

    <!-- 카테고리 탭 -->
    <BTabs v-model="selCtg" :options="cCategoriesAll" variant="outline" />

    <!-- 테이블 -->
    <div class="min-h-0 flex-1 overflow-auto">
      <StoreTable
        :stores="cFilteredStores"
        :categories="categories ?? []"
        @edit="onEdit"
        @remove="onRemove"
        @toggle-active="onToggleActive"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Plus, Search } from 'lucide-vue-next'
import { useToast } from 'primevue/usetoast'

import { useSearchFilter } from '@/composables/useSearchFilter'
import { useStoreCtgsQuery } from '@/queries/storeCtgsQuery'
import {
  useStoreActiveMutation,
  useStoreRemoveMutation,
  useStoresQuery,
} from '@/queries/storesQuery'
import { useStoreFormStore } from '@/stores/storeFormStore'

const ALL_CTG_SEQ = 0

// 관리 페이지는 비활성 매장도 포함해서 조회
const { data: stores } = useStoresQuery(true)
const { data: categories } = useStoreCtgsQuery()

const searchKeyword = ref('')
const selCtg = ref(ALL_CTG_SEQ)

const cCategoriesAll = computed(() => [
  { val: ALL_CTG_SEQ, label: '전체' },
  ...(categories.value ?? []).map((c) => ({ val: c.seq, label: c.nm })),
])

const cByCategory = computed(() =>
  selCtg.value === ALL_CTG_SEQ
    ? stores.value ?? []
    : (stores.value ?? []).filter((s) => s.ctgSeq === selCtg.value),
)
const { cFiltered: cFilteredStores } = useSearchFilter(cByCategory, searchKeyword, (s) => s.nm)

const router = useRouter()
const toast = useToast()
const storeFormStore = useStoreFormStore()
const { mutate: removeStore } = useStoreRemoveMutation()
const { mutate: patchActive } = useStoreActiveMutation()

function onAdd() {
  storeFormStore.reset()
  router.push('/stores/edit')
}

function onEdit(seq: number) {
  const store = stores.value?.find((s) => s.seq === seq)
  if (!store) return
  storeFormStore.loadFromStore(store)
  router.push('/stores/edit')
}

function onRemove(seq: number) {
  removeStore(seq, {
    onSuccess: () => toast.add({ severity: 'success', summary: '매장 삭제', life: 2500 }),
  })
}

function onToggleActive(seq: number, active: boolean) {
  patchActive(
    { seq, active },
    {
      onSuccess: () =>
        toast.add({
          severity: 'success',
          summary: active ? '매장 활성화' : '매장 비활성화',
          life: 2500,
        }),
    },
  )
}
</script>
