<template>
  <section class="menu-grid flex flex-col gap-5">
    <!-- 헤더 row: 검색 + 정렬 토글 -->
    <div class="flex items-center gap-3">
      <IconField class="w-60">
        <InputIcon class="text-surface-500">
          <Search :size="16" />
        </InputIcon>
        <InputText
          ref="eltInput"
          v-model="searchKeyword"
          placeholder="메뉴 검색"
          :disabled="isSortMode"
          class="h-14 w-full"
          @keydown.esc="searchKeyword = ''"
        />
      </IconField>
      <div class="flex-1" />
      <BButton
        v-if="sortable"
        variant="outlined"
        :color="isSortMode ? 'primary' : 'secondary'"
        size="md"
        @click="onToggleSortMode"
      >
        <ArrowUpDown :size="16" />
        {{ isSortMode ? '완료' : '정렬' }}
      </BButton>
    </div>

    <!-- 정렬 모드 안내 -->
    <BInfoBanner v-if="isSortMode">
      💡 드래그로 순서를 변경하세요. [완료] 버튼으로 종료
    </BInfoBanner>

    <!-- 카테고리 탭 (일반) / sortable 카테고리 (정렬 모드) -->
    <BTabs v-if="!isSortMode" v-model="selCtg" :options="cCategoriesAll" />
    <VueDraggable
      v-else
      v-model="sortableCtgs"
      :animation="200"
      ghost-class="opacity-40"
      class="flex flex-wrap gap-2"
      @end="onCtgDragEnd"
    >
      <span
        v-for="ctg in sortableCtgs"
        :key="ctg.seq"
        class="flex h-10 cursor-grab items-center rounded-lg border border-surface-200 bg-surface-0 px-4 text-base"
      >
        {{ ctg.nm }}
      </span>
    </VueDraggable>

    <!-- 카드 그리드 -->
    <VueDraggable
      v-if="isSortMode"
      v-model="sortableList"
      :animation="200"
      ghost-class="opacity-40"
      class="grid grid-cols-5 gap-5 overflow-auto"
      @end="onDragEnd"
    >
      <MenuCard v-for="menu in sortableList" :key="menu.seq" :menu="menu" class="cursor-grab" />
    </VueDraggable>
    <div v-else class="grid grid-cols-5 gap-5 overflow-auto">
      <MenuCard v-for="menu in cFilteredMenus" :key="menu.seq" :menu="menu" @click="onSelect" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowUpDown, Search } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

import { useAutoFocus } from '@/composables/useAutoFocus'
import { useSearchFilter } from '@/composables/useSearchFilter'
import type { Menu, MenuCategory } from '@/types/menu'

const ALL_CTG_SEQ = 0

const props = defineProps<{
  menus: readonly Menu[]
  categories: readonly MenuCategory[]
  /** v-show 로 보여지는 상태인지 — true 일 때 검색창 자동 포커스 */
  active?: boolean
  /** true 면 정렬 토글 버튼 표시. */
  sortable?: boolean
}>()

const emit = defineEmits<{
  add: [menuSeq: number]
  /** 정렬 모드에서 메뉴 드래그 종료 시 새 순서 (seq 배열). */
  reorder: [seqs: number[]]
  /** 정렬 모드에서 카테고리 드래그 종료 시 새 순서 (ctgSeq 배열). */
  'reorder-categories': [seqs: number[]]
}>()

const searchKeyword = ref('')
const selCtg = ref(ALL_CTG_SEQ)
const eltInput = ref<{ $el?: HTMLInputElement }>()

const isSortMode = ref(false)

const sortableList = ref<Menu[]>([])
const sortableCtgs = ref<MenuCategory[]>([])
watch(
  () => [props.menus, props.categories, isSortMode.value] as const,
  ([menus, categories, sortMode]) => {
    if (sortMode) {
      sortableList.value = [...menus]
      sortableCtgs.value = [...categories]
    }
  },
  { immediate: true },
)

const cCategoriesAll = computed(() => [
  { val: ALL_CTG_SEQ, label: '전체' },
  ...props.categories.map((ctg) => ({ val: ctg.seq, label: ctg.nm })),
])

const cByCategory = computed(() =>
  selCtg.value === ALL_CTG_SEQ ? props.menus : props.menus.filter((m) => m.ctgSeq === selCtg.value),
)

const { cFiltered: cFilteredMenus } = useSearchFilter(cByCategory, searchKeyword, (m) => m.nm)

useAutoFocus(eltInput, () => props.active && !isSortMode.value)

function onToggleSortMode() {
  isSortMode.value = !isSortMode.value
  if (isSortMode.value) {
    selCtg.value = ALL_CTG_SEQ
    searchKeyword.value = ''
  } else {
    nextTick(() => eltInput.value?.$el?.focus())
  }
}

/** 카드 선택 시: 카트 추가 + 검색어 초기화 + 재포커스 (빠른 연속 검색을 위해) */
function onSelect(menuSeq: number) {
  emit('add', menuSeq)
  searchKeyword.value = ''
  nextTick(() => eltInput.value?.$el?.focus())
}

function onDragEnd() {
  emit(
    'reorder',
    sortableList.value.map((m) => m.seq),
  )
}

function onCtgDragEnd() {
  emit(
    'reorder-categories',
    sortableCtgs.value.map((c) => c.seq),
  )
}
</script>
