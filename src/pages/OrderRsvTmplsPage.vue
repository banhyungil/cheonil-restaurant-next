<!-- 예약 템플릿 -->
<template>
  <section class="order-rsv-tmpls-page flex h-full flex-col gap-5 px-8 py-6">
    <!-- 헤더 -->
    <header class="flex h-10 items-center gap-3">
      <h1 class="text-2xl font-bold text-surface-900">예약 템플릿</h1>
      <span class="text-base text-surface-500">· 반복 예약 관리</span>
      <div class="flex-1" />
      <!-- TODO 매장 필터 — storesQuery 연결 -->
      <Select v-model="selStoreSeq" :options="[]" placeholder="매장 전체" class="w-40" />
      <Select
        v-model="selDayType"
        :options="DAY_TYPE_OPTIONS"
        option-label="label"
        option-value="val"
        placeholder="요일 전체"
        show-clear
        class="w-32"
      />
      <BTabs v-model="selActive" :options="ACTIVE_OPTIONS" variant="outline" />
      <BButton color="primary" class="w-fit! px-2!" @click="onAdd">
        <Plus :size="16" />
        템플릿 추가
      </BButton>
    </header>

    <!-- 통계 카드 -->
    <OrderRsvTmplStatsCards :stats="cStats" />

    <!-- 테이블 -->
    <div class="min-h-0 flex-1 overflow-auto">
      <OrderRsvTmplTable
        :tmpls="cTmpls"
        @edit="onEdit"
        @toggle-active="onToggleActive"
        @toggle-auto-order="onToggleAutoOrder"
        @remove="onRemove"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { useToast } from 'primevue/usetoast'

import {
  useOrderRsvTmplActiveMutation,
  useOrderRsvTmplAutoOrderMutation,
  useOrderRsvTmplRemoveMutation,
  useOrderRsvTmplsQuery,
} from '@/queries/orderRsvTmplsQuery'
import { useStoresQuery } from '@/queries/storesQuery'
import { useOrderRsvTmplStore } from '@/stores/orderRsvTmplStore'
import type { DayType } from '@/types/orderRsv'

const DAY_TYPE_OPTIONS: { val: DayType; label: string }[] = [
  { val: 'MON', label: '월' },
  { val: 'TUE', label: '화' },
  { val: 'WED', label: '수' },
  { val: 'THU', label: '목' },
  { val: 'FRI', label: '금' },
  { val: 'SAT', label: '토' },
  { val: 'SUN', label: '일' },
]

const ACTIVE_OPTIONS = [
  { val: 'all', label: '전체' },
  { val: 'active', label: '활성' },
  { val: 'inactive', label: '비활성' },
] as const
type ActiveVal = (typeof ACTIVE_OPTIONS)[number]['val']

const selStoreSeq = ref<number | null>(null)
const selDayType = ref<DayType | null>(null)
const selActive = ref<ActiveVal>('all')

// 전체 list 한 번 가져오고 client-side 필터링 — 통계도 동일 list 에서 derive
const { data: tmpls } = useOrderRsvTmplsQuery()

const cTmpls = computed(() => {
  let list = tmpls.value ?? []
  if (selStoreSeq.value != null) {
    list = list.filter((t) => t.storeSeq === selStoreSeq.value)
  }
  if (selDayType.value) {
    list = list.filter((t) => t.dayTypes.includes(selDayType.value!))
  }
  if (selActive.value !== 'all') {
    list = list.filter((t) => t.active === (selActive.value === 'active'))
  }
  return list
})

const cStats = computed(() => ({
  total: tmpls.value?.length ?? 0,
  active: tmpls.value?.filter((t) => t.active).length ?? 0,
  inactive: tmpls.value?.filter((t) => !t.active).length ?? 0,
  generatedToday: 0, // TODO 백엔드 endpoint 추가 시 보강
}))

const router = useRouter()
const toast = useToast()
const orderRsvTmplStore = useOrderRsvTmplStore()
const { data: stores } = useStoresQuery()
const { mutate: patchActive } = useOrderRsvTmplActiveMutation()
const { mutate: patchAutoOrder } = useOrderRsvTmplAutoOrderMutation()
const { mutate: removeTmpl } = useOrderRsvTmplRemoveMutation()

function onAdd() {
  orderRsvTmplStore.reset()
  router.push('/order-rsv-tmpls/edit')
}

function onEdit(seq: number) {
  const tmpl = tmpls.value?.find((t) => t.seq === seq)
  if (!tmpl) return
  const store = stores.value?.find((s) => s.seq === tmpl.storeSeq)
  if (!store) return
  orderRsvTmplStore.loadFromTmpl(tmpl, store)
  router.push('/order-rsv-tmpls/edit')
}

function onToggleActive(seq: number, active: boolean) {
  patchActive(
    { seq, active },
    {
      onSuccess: () =>
        toast.add({ severity: 'success', summary: active ? '활성화' : '비활성화', life: 1500 }),
    },
  )
}

function onToggleAutoOrder(seq: number, autoOrder: boolean) {
  patchAutoOrder(
    { seq, autoOrder },
    {
      onSuccess: () =>
        toast.add({
          severity: 'success',
          summary: autoOrder ? '자동 주문 ON' : '자동 주문 OFF',
          life: 1500,
        }),
    },
  )
}

function onRemove(seq: number) {
  removeTmpl(seq, {
    onSuccess: () => toast.add({ severity: 'success', summary: '템플릿 삭제', life: 2000 }),
  })
}
</script>
