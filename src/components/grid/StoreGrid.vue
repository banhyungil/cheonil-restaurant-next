<template>
  <section class="store-grid flex flex-col gap-5 overflow-auto">
    <!-- 매장 검색 -->
    <IconField class="w-60">
      <InputIcon class="text-surface-500">
        <Search :size="16" />
      </InputIcon>
      <InputText
        ref="eltInput"
        v-model="searchKeyword"
        placeholder="매장 검색"
        class="h-14 w-full"
        @keydown.esc="searchKeyword = ''"
      />
    </IconField>

    <!-- 카테고리 탭 -->
    <BTabs v-model="selCtg" :options="cCategoriesAll" />

    <!-- 카드 그리드 -->
    <div class="grid grid-cols-5 gap-5">
      <StoreCard
        v-for="store in cFilteredStores"
        :key="store.seq"
        :store="store"
        :category-name="cCategoryNameByStore(store)"
        @click="onSelect"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { Search } from 'lucide-vue-next'
import { computed, nextTick, ref } from 'vue'

import { useAutoFocus } from '@/composables/useAutoFocus'
import { useSearchFilter } from '@/composables/useSearchFilter'
import type { Store, StoreCategory } from '@/types/store'

const ALL_CTG_SEQ = 0

const props = defineProps<{
  stores: readonly Store[]
  categories: readonly StoreCategory[]
  /** v-show 로 보여지는 상태인지 — true 일 때 검색창 자동 포커스 */
  active?: boolean
}>()

const emit = defineEmits<{
  select: [storeSeq: number]
}>()

const searchKeyword = ref('')
const selCtg = ref(ALL_CTG_SEQ)
const eltInput = ref<{ $el?: HTMLInputElement }>()

const cCategoriesAll = computed(() => [
  { val: ALL_CTG_SEQ, label: '전체' },
  ...props.categories.map((ctg) => ({ val: ctg.seq, label: ctg.nm })),
])

const cByCategory = computed(() =>
  selCtg.value === ALL_CTG_SEQ
    ? props.stores
    : props.stores.filter((s) => s.ctgSeq === selCtg.value),
)

const { cFiltered: cFilteredStores } = useSearchFilter(cByCategory, searchKeyword, (s) => s.nm)

const cCategoryByCtgSeq = computed(() => _.keyBy(props.categories, 'seq'))

function cCategoryNameByStore(store: Store): string | undefined {
  return cCategoryByCtgSeq.value[store.ctgSeq]?.nm
}

useAutoFocus(eltInput, () => props.active)

/** 카드 선택 시: 매장 선택 + 검색어 초기화 + 재포커스 (빠른 연속 검색을 위해) */
function onSelect(storeSeq: number) {
  emit('select', storeSeq)
  searchKeyword.value = ''
  nextTick(() => eltInput.value?.$el?.focus())
}
</script>
