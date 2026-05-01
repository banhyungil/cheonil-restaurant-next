<!-- 주문내역관리 — [그리드][통계] 두 탭 통합 -->
<template>
  <section class="sales-page flex h-full flex-col gap-5 px-8 py-6">
    <!-- 헤더 + 탭 -->
    <header class="flex items-center gap-4">
      <h1 class="text-2xl font-bold text-surface-900">주문내역관리</h1>
      <BTabs
        :model-value="cTab"
        :options="TAB_OPTIONS"
        variant="outline"
        class="ml-4"
        @update:model-value="onChangeTab"
      />
    </header>

    <!-- 그리드 탭 -->
    <template v-if="cTab === 'grid'">
      <SalesGridFilterBar :filter="filter" @search="onSearch" @reset="onReset" />

      <SalesSummaryCards :summary="summary" />

      <div class="min-h-0 flex-1 overflow-auto">
        <SalesGridTable
          v-model:selection="selection"
          :rows="orders ?? []"
          @remove="onRemove"
        />
      </div>
    </template>

    <!-- 통계 탭 (placeholder — 차후 단계) -->
    <template v-else>
      <div class="flex h-full items-center justify-center text-surface-500">
        통계 탭 — 차차 구현
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  useOrdersQuery,
  useOrdersRemoveMutation,
  useOrdersSummaryQuery,
} from '@/queries/salesQuery'
import type { OrderRow } from '@/types/sales'

import type { OrdersParams } from '@/apis/salesApi'
import type { GridFilter } from '@/components/sales/SalesGridFilterBar.vue'

type SalesTab = 'grid' | 'stats'

const TAB_OPTIONS = [
  { val: 'grid', label: '그리드' },
  { val: 'stats', label: '통계' },
] as const

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

// --- tab (URL query 보존) ---
const cTab = computed<SalesTab>(() => (route.query.tab === 'stats' ? 'stats' : 'grid'))
function onChangeTab(t: SalesTab) {
  router.replace({ query: { ...route.query, tab: t } })
}

// --- 필터: draft (편집 중) + applied (검색 버튼 누른 값). ---
// applied 가 있어야 useQuery 호출. enabled = applied !== null.
const filter = reactive<GridFilter>({
  storeSeq: null,
  menuSeq: null,
  from: null,
  to: null,
  payType: 'ALL',
})

const appliedParams = ref<OrdersParams | null>(null)

function onSearch(params: OrdersParams) {
  appliedParams.value = params
  selection.value = []
}

function onReset() {
  appliedParams.value = null
  selection.value = []
}

const cQueryParams = computed<OrdersParams>(
  () => appliedParams.value ?? { from: '', to: '' },
)
const cQueryEnabled = computed(() => appliedParams.value != null)

const { data: orders } = useOrdersQuery(cQueryParams, cQueryEnabled)
const { data: summary } = useOrdersSummaryQuery(cQueryParams, cQueryEnabled)

// --- 선택 + 삭제 ---
const selection = ref<OrderRow[]>([])
const { mutate: removeOrders } = useOrdersRemoveMutation()

function onRemove() {
  if (selection.value.length === 0) return
  const seqs = selection.value.map((r) => r.orderSeq)
  confirm.require({
    message: `선택한 ${seqs.length}건의 주문을 삭제하시겠습니까?\n주문/메뉴/결제 데이터가 모두 함께 삭제되며 복구할 수 없습니다.`,
    header: '주문 삭제 (회계 정정)',
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { severity: 'danger' },
    accept: () => {
      removeOrders(seqs, {
        onSuccess: () => {
          toast.add({ severity: 'success', summary: `주문 ${seqs.length}건 삭제`, life: 2500 })
          selection.value = []
        },
      })
    },
  })
}
</script>
