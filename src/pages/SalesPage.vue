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

      <SalesGridSummaryCards :summary="summary" />

      <div class="min-h-0 flex-1 overflow-auto">
        <SalesGridTable
          v-model:selection="selection"
          :rows="orders ?? []"
          @remove="onRemove"
        />
      </div>
    </template>

    <!-- 통계 탭 -->
    <template v-else>
      <SalesStatsHeader
        v-model:from="statsFrom"
        v-model:to="statsTo"
        :view="cStatsView"
        :summary="statsBasic"
        @update:view="onChangeStatsView"
      />

      <div class="min-h-0 flex-1 overflow-auto">
        <StatsBasicView
          v-if="cStatsView === 'basic'"
          v-model:granularity="statsGranularity"
          :basic="statsBasic"
          :trend="statsTrend"
        />
        <div v-else class="flex h-full items-center justify-center text-surface-500">
          {{ cStatsView === 'menu' ? '메뉴 분석' : '점포 분석' }} — 차후 구현
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { format, subDays } from 'date-fns'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  useOrdersQuery,
  useOrdersRemoveMutation,
  useOrdersSummaryQuery,
  useStatsBasicQuery,
  useStatsTrendQuery,
} from '@/queries/salesQuery'
import type { OrderRow } from '@/types/sales'
import type { StatsGranularity } from '@/types/salesStats'

import type { OrdersParams } from '@/apis/salesApi'
import type { GridFilter } from '@/components/sales/SalesGridFilterBar.vue'
import type { StatsView } from '@/components/sales/SalesStatsHeader.vue'

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

/** 기본 날짜 범위 — 오늘 기준 최근 7일 (양 끝 포함). */
function getDefaultRange(): { from: string; to: string } {
  const today = new Date()
  return {
    from: format(subDays(today, 6), 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
  }
}
const DEFAULT_RANGE = getDefaultRange()

// --- 필터: draft (편집 중) + applied (검색 버튼 누른 값). ---
// 진입 시 기본 범위로 자동 1회 조회 (필터 변경은 검색 버튼 trigger 만 §7-4).
const filter = reactive<GridFilter>({
  storeSeq: null,
  menuSeq: null,
  from: DEFAULT_RANGE.from,
  to: DEFAULT_RANGE.to,
  payType: 'ALL',
})

const appliedParams = ref<OrdersParams | null>({
  from: DEFAULT_RANGE.from,
  to: DEFAULT_RANGE.to,
})

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

// ────────────────────────────────────────────
// 통계 탭 — view / 날짜 범위 / granularity (그리드와 별도 state §7-2)
// ────────────────────────────────────────────
const cStatsView = computed<StatsView>(() => {
  const v = route.query.view
  return v === 'menu' || v === 'store' ? v : 'basic'
})
function onChangeStatsView(v: StatsView) {
  router.replace({ query: { ...route.query, view: v } })
}

// 통계도 동일한 기본 범위로 진입 (그리드와 별도 state — 이후 사용자 변경분만 분리 §7-2).
const statsFrom = ref<string | null>(DEFAULT_RANGE.from)
const statsTo = ref<string | null>(DEFAULT_RANGE.to)
const statsGranularity = ref<StatsGranularity>('day')

const cStatsRangeReady = computed(
  () => statsFrom.value != null && statsTo.value != null,
)

const cStatsParams = computed(() => ({
  from: statsFrom.value ?? '',
  to: statsTo.value ?? '',
}))
const cStatsTrendParams = computed(() => ({
  from: statsFrom.value ?? '',
  to: statsTo.value ?? '',
  granularity: statsGranularity.value,
}))

const { data: statsBasic } = useStatsBasicQuery(cStatsParams, cStatsRangeReady)
const { data: statsTrend } = useStatsTrendQuery(cStatsTrendParams, cStatsRangeReady)
</script>
