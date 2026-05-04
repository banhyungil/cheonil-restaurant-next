<!-- 통계 - 점포 분석 뷰 — 5 카드 (점포별 매출 / 메뉴 비중 / 주문 빈도 / 미수 / 결제분포) -->
<template>
  <div class="stats-store-view flex flex-col gap-4">
    <!-- 1행: 점포별 매출 + 점포별 메뉴 비중 -->
    <div class="grid grid-cols-2 gap-4">
      <BarHorizontalRanking title="🏪 점포별 매출" suffix="매출순" :rows="cStoreSales" unit="KRW" />
      <StoreMenuMixCard
        :store-options="cStoreOptions"
        :sel-store-seq="selStoreSeq"
        :parts="store?.storeMenuParts ?? []"
        @update:sel-store-seq="emit('update:selStoreSeq', $event)"
      />
    </div>

    <!-- 2행: 주문 빈도 / 미수 현황 / 결제방식 분포 -->
    <div class="grid grid-cols-3 gap-4">
      <RankList title="📊 주문 빈도" :rows="cOrderCounts" />
      <UnpaidByStoreCard :rows="store?.unpaidByStore ?? []" />
      <BarStackedDistribution title="💳 결제방식 분포" :rows="cPayDistribution" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { StatsStore } from '@/types/salesStats'

import BarHorizontalRanking from './charts/BarHorizontalRanking.vue'
import BarStackedDistribution from './charts/BarStackedDistribution.vue'
import RankList from './charts/RankList.vue'
import StoreMenuMixCard from './StoreMenuMixCard.vue'
import UnpaidByStoreCard from './UnpaidByStoreCard.vue'

const props = defineProps<{
  store: StatsStore | undefined
  selStoreSeq: number | null
}>()

const emit = defineEmits<{
  'update:selStoreSeq': [v: number | null]
}>()

const cStoreSales = computed(() =>
  (props.store?.stores ?? []).map((s) => ({ label: s.storeNm, amount: s.amount })),
)

const cStoreOptions = computed(() =>
  (props.store?.stores ?? []).map((s) => ({ val: s.storeSeq, label: s.storeNm })),
)

const cOrderCounts = computed(() =>
  (props.store?.orderCounts ?? []).map((c) => ({ label: c.storeNm, value: c.count })),
)

const cPayDistribution = computed(() =>
  (props.store?.payDistribution ?? []).map((p) => ({
    label: p.storeNm,
    cash: p.cash,
    card: p.card,
    unpaid: p.unpaid,
  })),
)
</script>
