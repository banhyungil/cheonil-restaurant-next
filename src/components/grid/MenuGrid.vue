<template>
  <section class="menu-grid flex flex-col gap-5">
    <!-- 메뉴 검색 -->
    <IconField class="w-60">
      <InputIcon class="text-surface-500">
        <Search :size="16" />
      </InputIcon>
      <InputText v-model="searchKeyword" placeholder="메뉴 검색" class="h-14 w-full" />
    </IconField>

    <!-- 카테고리 탭 -->
    <CategoryTabs v-model="selCtg" :categories="cCategoriesAll" />

    <!-- 카드 그리드 -->
    <div class="grid grid-cols-5 gap-5">
      <MenuCard
        v-for="menu in cFilteredMenus"
        :key="menu.seq"
        :menu="menu"
        @click="(seq: number) => emit('add', seq)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import type { Menu, MenuCategory } from '@/types/menu'

const ALL_CTG_SEQ = 0

const props = defineProps<{
  menus: readonly Menu[]
  categories: readonly MenuCategory[]
}>()

const emit = defineEmits<{
  add: [menuSeq: number]
}>()

const searchKeyword = ref('')
const selCtg = ref(ALL_CTG_SEQ)

const cCategoriesAll = computed(() => [{ seq: ALL_CTG_SEQ, nm: '전체' }, ...props.categories])

const cFilteredMenus = computed(() =>
  selCtg.value === ALL_CTG_SEQ ? props.menus : props.menus.filter((m) => m.ctgSeq === selCtg.value),
)
</script>
