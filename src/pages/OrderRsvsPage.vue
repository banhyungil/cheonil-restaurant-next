<!-- 예약 관리 -->
<template>
  <section class="order-rsvs-page flex h-full flex-col gap-5 px-8 py-6">
    <!-- 헤더 -->
    <header class="flex h-10 items-center gap-3">
      <h1 class="text-2xl font-bold text-surface-900">예약 관리</h1>
      <span class="text-base text-surface-500">· {{ cModeLabel }} 예약</span>
      <div class="flex-1" />
      <BTabs v-model="selDayMode" :options="DAY_MODE_OPTIONS" variant="outline" />
      <Select
        v-model="selStoreSeq"
        :options="cStoresWithSearch"
        option-label="nm"
        option-value="seq"
        :filter-fields="['_searchKey']"
        placeholder="매장 전체"
        show-clear
        filter
        filter-placeholder="매장 검색 (초성 가능)"
        auto-filter-focus
        class="w-40"
      />
      <BButton color="primary" class="w-fit! px-2!" @click="onAdd">
        <Plus :size="16" />
        예약 추가
      </BButton>
    </header>

    <!-- 본문 -->
    <div class="flex flex-1 flex-col gap-6 overflow-auto min-h-0">
      <!-- 진행 중 예약 -->
      <section class="flex flex-1 flex-col gap-3">
        <div class="flex h-7 items-center gap-2.5">
          <span class="size-2 rounded bg-blue-500" />
          <h2 class="text-lg font-bold text-surface-900">진행 중 예약 ({{ cModeLabel }})</h2>
          <span
            class="flex h-5.5 items-center justify-center rounded-full bg-blue-500 px-2.5 text-xs font-bold text-white"
          >
            {{ cReadyRsvs.length }}
          </span>
          <div class="flex-1" />
          <!-- 범례 -->
          <div class="flex items-center gap-3 text-xs text-surface-500">
            <span class="flex items-center gap-1"
              ><span class="size-2 rounded bg-blue-500" /> 여유</span
            >
            <span class="flex items-center gap-1"
              ><span class="size-2 rounded bg-orange-500" /> 30분↓</span
            >
            <span class="flex items-center gap-1"
              ><span class="size-2 rounded bg-red-500" /> 20분↓</span
            >
          </div>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(388px,1fr))] gap-4">
          <OrderRsvReadyCard
            v-for="rsv in cReadyRsvs"
            :key="rsv.seq"
            :rsv="rsv"
            @accept="onAccept"
            @cancel="onCancel"
            @edit="onEdit"
            @remove="onRemove"
          />
        </div>
      </section>

      <!-- 처리 이력 (당일) -->
      <section class="flex flex-col gap-3">
        <div class="flex h-7 items-center gap-2.5">
          <span class="size-2 rounded bg-surface-400" />
          <h2 class="text-lg font-bold text-surface-900">처리 이력 (당일)</h2>
          <span
            class="flex h-5.5 items-center justify-center rounded-full bg-surface-400 px-2.5 text-xs font-bold text-white"
          >
            {{ cHistoryRsvs.length }}
          </span>
          <div class="flex-1" />
          <span class="text-xs text-surface-500">※ 처리 후 1시간 이내 복구 가능</span>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          <OrderRsvHistoryCard
            v-for="rsv in cHistoryRsvs"
            :key="rsv.seq"
            :rsv="rsv"
            @restore="onRestore"
          />
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getChoseong } from 'hangul-util'
import { Plus } from 'lucide-vue-next'
import { useToast } from 'primevue/usetoast'

import {
  useOrderRsvRemoveMutation,
  useOrderRsvsMonitorQuery,
  useOrderRsvStatusMutation,
} from '@/queries/orderRsvsQuery'
import { useStoresQuery } from '@/queries/storesQuery'
import { useOrderRsvCartStore } from '@/stores/orderRsvCartStore'

const DAY_MODE_OPTIONS = [
  { val: 'TODAY', label: '당일' },
  { val: 'ALL', label: '모두' },
] as const
type DayModeVal = (typeof DAY_MODE_OPTIONS)[number]['val']

const selDayMode = ref<DayModeVal>('TODAY')
const selStoreSeq = ref<number | null>(null)

const cModeLabel = computed(() => DAY_MODE_OPTIONS.find((o) => o.val == selDayMode.value)?.label)

const { data: rsvs } = useOrderRsvsMonitorQuery(selDayMode, selStoreSeq)
const { data: stores } = useStoresQuery()

/** 매장명 + 초성을 합친 검색용 필드 추가 — Select 의 filter-fields 가 contains 매칭 */
const cStoresWithSearch = computed(() =>
  (stores.value ?? []).map((s) => ({
    ...s,
    _searchKey: `${s.nm} ${getChoseong(s.nm)}`,
  })),
)

const cReadyRsvs = computed(() => rsvs.value?.ready ?? [])
const cHistoryRsvs = computed(() => rsvs.value?.history ?? [])

const router = useRouter()
const toast = useToast()
const orderRsvCartStore = useOrderRsvCartStore()
const { mutate: updateStatus } = useOrderRsvStatusMutation()
const { mutate: removeRsv } = useOrderRsvRemoveMutation()

function onAdd() {
  orderRsvCartStore.reset()
  router.push('/order-rsvs/edit')
}

function onAccept(seq: number) {
  updateStatus(
    { seq, status: 'COMPLETED' },
    {
      onSuccess: () =>
        toast.add({ severity: 'success', summary: '예약 접수 (주문 생성)', life: 2000 }),
      // onError: 글로벌 인터셉터가 자동 토스트 (backend message 표시)
    },
  )
}

function onCancel(seq: number) {
  updateStatus(
    { seq, status: 'CANCELED' },
    {
      onSuccess: () => toast.add({ severity: 'success', summary: '예약 취소', life: 2000 }),
    },
  )
}

function onEdit(seq: number) {
  const rsv = cReadyRsvs.value.find((r) => r.seq === seq)
  if (!rsv) return
  const store = stores.value?.find((s) => s.seq === rsv.storeSeq)
  if (!store) return
  orderRsvCartStore.loadFromRsv(rsv, store)
  router.push('/order-rsvs/edit')
}

function onRemove(seq: number) {
  removeRsv(seq, {
    onSuccess: () => toast.add({ severity: 'success', summary: '예약 삭제', life: 2000 }),
  })
}

function onRestore(seq: number) {
  updateStatus(
    { seq, status: 'RESERVED' },
    {
      onSuccess: () => toast.add({ severity: 'success', summary: '예약 복구', life: 2000 }),
    },
  )
}
</script>
