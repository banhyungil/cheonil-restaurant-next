<template>
  <section class="menu-grid flex flex-col gap-5 overflow-auto">
    <!-- 메뉴 검색 -->
    <IconField class="w-60">
      <InputIcon class="text-surface-500">
        <Search :size="16" />
      </InputIcon>
      <InputText
        ref="eltInput"
        v-model="searchKeyword"
        placeholder="메뉴 검색"
        class="h-14 w-full"
        @keydown.esc="searchKeyword = ''"
      />
    </IconField>

    <!-- 카테고리 탭 -->
    <BTabs v-model="selCtg" :options="cCategoriesAll" />

    <!-- 카드 그리드 -->
    <div class="grid grid-cols-5 gap-5">
      <MenuCard v-for="menu in cFilteredMenus" :key="menu.seq" :menu="menu" @click="onSelect" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { computed, nextTick, ref } from 'vue'

import { useAutoFocus } from '@/composables/useAutoFocus'
import { useSearchFilter } from '@/composables/useSearchFilter'
import type { Menu, MenuCategory } from '@/types/menu'

const ALL_CTG_SEQ = 0

const props = defineProps<{
  menus: readonly Menu[]
  categories: readonly MenuCategory[]
  /** v-show 로 보여지는 상태인지 — true 일 때 검색창 자동 포커스 */
  active?: boolean
}>()

const emit = defineEmits<{
  add: [menuSeq: number]
}>()

const searchKeyword = ref('')
const selCtg = ref(ALL_CTG_SEQ)
const eltInput = ref<{ $el?: HTMLInputElement }>()

const cCategoriesAll = computed(() => [{ seq: ALL_CTG_SEQ, nm: '전체' }, ...props.categories])

const cByCategory = computed(() =>
  selCtg.value === ALL_CTG_SEQ ? props.menus : props.menus.filter((m) => m.ctgSeq === selCtg.value),
)

const { cFiltered: cFilteredMenus } = useSearchFilter(cByCategory, searchKeyword, (m) => m.nm)

useAutoFocus(eltInput, () => props.active)

/** 카드 선택 시: 카트 추가 + 검색어 초기화 + 재포커스 (빠른 연속 검색을 위해) */
function onSelect(menuSeq: number) {
  emit('add', menuSeq)
  searchKeyword.value = ''
  nextTick(() => eltInput.value?.$el?.focus())
}
</script>
