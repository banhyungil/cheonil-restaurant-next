<!-- 주문현황 -->
<template>
  <section class="orders-monitor-page flex h-full flex-col gap-5 px-8 py-6">
    <!-- 헤더 -->
    <header class="flex h-10 items-center gap-3">
      <h1 class="text-2xl font-bold text-surface-900">주문현황</h1>
      <span class="text-base text-surface-500">· 실시간 주문 상태를 확인하세요</span>
      <div class="flex-1" />
      <BTabs v-model="selMode" :options="MODE_OPTIONS" />
    </header>

    <div class="flex flex-col flex-1">
      <!-- 진행 중 주문 -->
      <div class="flex flex-1 flex-col gap-3">
        <div class="flex h-7 items-center gap-2.5">
          <span class="size-2 rounded bg-blue-500" />
          <h2 class="text-lg font-bold text-surface-900">진행 중 주문</h2>
          <span
            class="flex h-5.5 items-center justify-center rounded-full bg-blue-500 px-2.5 text-xs font-bold text-white"
          >
            {{ cReadyOrders.length }}
          </span>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          <OrderReadyCard
            v-for="order in cReadyOrders"
            :key="order.seq"
            :order="order"
            :mode="selMode"
            @complete="onComplete"
            @edit="onEdit"
            @remove="onRemove"
          />
        </div>
      </div>

      <!-- 주문완료 목록 -->
      <div v-if="selMode === 'ALL'" class="flex flex-col gap-3 min-h-48">
        <div class="flex h-7 items-center gap-2.5">
          <span class="size-2 rounded bg-primary-500" />
          <h2 class="text-lg font-bold text-surface-900">처리완료 목록 (최근)</h2>
          <span
            class="flex h-5.5 items-center justify-center rounded-full bg-primary-500 px-2.5 text-xs font-bold text-white"
          >
            {{ cCookedOrders.length }}
          </span>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          <OrderCookedCard
            v-for="order in cCookedOrders"
            :key="order.seq"
            :order="order"
            @cancel="onCancel"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useStoresQuery } from '@/queries/storesQuery'
import {
  useOrderRemoveMutation,
  useOrdersMonitorQuery,
  useOrderStatusMutation,
} from '@/queries/ordersQuery'
import { useOrderCartStore } from '@/stores/orderCartStore'
import { useToast } from 'primevue/usetoast'

const MODE_OPTIONS = [
  { val: 'ALL', label: '전체 보기' },
  { val: 'KITCHEN', label: '주방용' },
] as const
// Indexed Access Type
// 배열/튜플 타입에서 number는 "유효한 모든 인덱스"를 의미
type ModeVal = (typeof MODE_OPTIONS)[number]['val']

const selMode = ref<ModeVal>('ALL')

const { data: orders } = useOrdersMonitorQuery()
const { data: stores } = useStoresQuery()

const cReadyOrders = computed(() => orders.value?.filter((o) => o.status === 'READY') ?? [])
const cCookedOrders = computed(
  () =>
    // 내림차순 정렬
    orders.value
      ?.filter((o) => o.status === 'COOKED')
      .sort((a, b) => b.cookedAt!.localeCompare(a.cookedAt!)) ?? [],
)

const { mutate: updateStatus } = useOrderStatusMutation()
const { mutate: removeOrder } = useOrderRemoveMutation()

const router = useRouter()
const toast = useToast()
const orderCartStore = useOrderCartStore()

function onComplete(seq: number) {
  updateStatus({ seq, status: 'COOKED' })
}

function onCancel(seq: number) {
  updateStatus({ seq, status: 'READY' })
}

/** 수정 — draft 스토어에 hydrate 후 OrdersPage로 이동. KeepAlive 캐시는 store reactive로 자동 반영. */
function onEdit(seq: number) {
  const order = orders.value?.find((o) => o.seq === seq)
  if (!order) return
  const store = stores.value?.find((s) => s.seq === order.storeSeq)
  if (!store) return
  orderCartStore.loadFromOrder(order, store)
  router.push('/orders')
}

/** 삭제 — 즉시 호출 (confirm 없음). 캐시 갱신은 WS 담당. */
function onRemove(seq: number) {
  removeOrder(seq, {
    onSuccess: () => {
      toast.add({ severity: 'success', summary: '주문 삭제', life: 2000 })
    },
  })
}
</script>
