<!-- 마스터 관리 — 기준정보 탭 통합 -->
<template>
  <section class="master-page flex h-full flex-col gap-5 px-8 py-6">
    <header class="flex h-10 items-center gap-4">
      <h1 class="text-2xl font-bold text-surface-900">{{ route.meta.nav?.label }}</h1>
      <BTabs
        :model-value="cTab"
        :options="TAB_OPTIONS"
        variant="outline"
        class="ml-4"
        @update:model-value="onChangeTab"
      />
    </header>

    <div class="min-h-0 flex-1">
      <UnitsPage v-if="cTab === 'units'" />
      <ExpenseCtgsPage v-else-if="cTab === 'expenseCtgs'" />
      <IngredientsPage v-else-if="cTab === 'ingredients'" />
    </div>
  </section>
</template>

<script setup lang="ts">
import ExpenseCtgsPage from '@/pages/master/ExpenseCtgsPage.vue'
import IngredientsPage from '@/pages/master/IngredientsPage.vue'
import UnitsPage from '@/pages/master/UnitsPage.vue'

const TAB_OPTIONS = [
  { val: 'units' as const, label: '단위' },
  { val: 'expenseCtgs' as const, label: '지출 카테고리' },
  { val: 'ingredients' as const, label: '식자재' },
]
type MasterTab = (typeof TAB_OPTIONS)[number]['val']

const route = useRoute()
const router = useRouter()

// --- tab (URL query 보존) ---
const cTab = computed<MasterTab>(
  () => TAB_OPTIONS.find((o) => o.val === route.query.tab)?.val ?? 'units',
)
function onChangeTab(t: MasterTab) {
  router.replace({ query: { ...route.query, tab: t } })
}
</script>
