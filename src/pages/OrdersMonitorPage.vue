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
            :mode="cMode"
            @complete="onComplete"
          />
        </div>
      </div>

      <!-- 주문완료 목록 -->
      <div class="flex flex-col gap-3">
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
            :mode="cMode"
            @cancel="onCancel"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { useOrdersQuery, useOrderStatusMutation } from '@/queries/ordersQuery'

const MODE_ALL = 1
const MODE_KITCHEN = 2

const MODE_OPTIONS = [
  { seq: MODE_ALL, nm: '전체 보기' },
  { seq: MODE_KITCHEN, nm: '주방용' },
] as const

const selMode = ref<number>(MODE_ALL)
const cMode = computed<'all' | 'kitchen'>(() => (selMode.value === MODE_ALL ? 'all' : 'kitchen'))

const { data: orders } = useOrdersQuery()

const cReadyOrders = computed(() => orders.value?.filter((o) => o.status === 'READY') ?? [])
const cCookedOrders = computed(() => orders.value?.filter((o) => o.status === 'COOKED') ?? [])

const { mutate: updateStatus } = useOrderStatusMutation()

function onComplete(seq: number) {
  updateStatus({ seq, status: 'COOKED' })
}

function onCancel(seq: number) {
  updateStatus({ seq, status: 'READY' })
}
</script>
