<!-- 메뉴 관리 -->
<template>
  <section class="menus-page flex h-full flex-col gap-5 px-8 py-6">
    <!-- 헤더 -->
    <header class="flex h-10 items-center gap-3">
      <h1 class="text-2xl font-bold text-surface-900">메뉴 관리</h1>
      <div class="flex-1" />
      <IconField class="w-60">
        <InputIcon class="text-surface-500">
          <Search :size="16" />
        </InputIcon>
        <BInputText
          v-model="searchKeyword"
          placeholder="메뉴 검색"
          class="h-10 w-full"
          @keydown.esc="searchKeyword = ''"
        />
      </IconField>
      <BButton color="primary" @click="onAdd">
        <Plus :size="16" />
        메뉴 추가
      </BButton>
    </header>

    <!-- 카테고리 탭 -->
    <BTabs v-model="selCtg" :options="cCategoriesAll" variant="outline" />

    <!-- 테이블 — DataTable virtualScroller 가 자체 스크롤 처리. min-h-0 + flex-1 로 영역만 확보 -->
    <div class="min-h-0 flex-1">
      <MenuTable
        :menus="cFilteredMenus"
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
import { useMenuCtgsQuery } from '@/queries/menuCtgsQuery'
import {
  useMenuActiveMutation,
  useMenuRemoveMutation,
  useMenusQuery,
} from '@/queries/menusQuery'
import { useMenuFormStore } from '@/stores/menuFormStore'

const ALL_CTG_SEQ = 0

// 관리 페이지는 비활성 메뉴도 포함해서 조회
const { data: menus } = useMenusQuery(true)
const { data: categories } = useMenuCtgsQuery()

const searchKeyword = ref('')
const selCtg = ref(ALL_CTG_SEQ)

const cCategoriesAll = computed(() => [
  { val: ALL_CTG_SEQ, label: '전체' },
  ...(categories.value ?? []).map((c) => ({ val: c.seq, label: c.nm })),
])

const cByCategory = computed(() =>
  selCtg.value === ALL_CTG_SEQ
    ? menus.value ?? []
    : (menus.value ?? []).filter((m) => m.ctgSeq === selCtg.value),
)
const { cFiltered: cFilteredMenus } = useSearchFilter(cByCategory, searchKeyword, (m) => m.nm)

const router = useRouter()
const toast = useToast()
const menuFormStore = useMenuFormStore()
const { mutate: removeMenu } = useMenuRemoveMutation()
const { mutate: patchActive } = useMenuActiveMutation()

function onAdd() {
  menuFormStore.reset()
  router.push('/menus/edit')
}

function onEdit(seq: number) {
  const menu = menus.value?.find((m) => m.seq === seq)
  if (!menu) return
  menuFormStore.loadFromMenu(menu)
  router.push('/menus/edit')
}

function onRemove(seq: number) {
  removeMenu(seq, {
    onSuccess: () => toast.add({ severity: 'success', summary: '메뉴 삭제', life: 2500 }),
  })
}

function onToggleActive(seq: number, active: boolean) {
  patchActive(
    { seq, active },
    {
      onSuccess: () =>
        toast.add({
          severity: 'success',
          summary: active ? '메뉴 활성화' : '메뉴 비활성화',
          life: 2500,
        }),
    },
  )
}
</script>
