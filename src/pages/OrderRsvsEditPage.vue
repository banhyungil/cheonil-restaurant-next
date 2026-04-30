<!-- 예약 생성/수정 통합 -->
<template>
  <section class="order-rsvs-edit-page flex h-full flex-col gap-5 bg-surface-50 px-8 py-6">
    <!-- 헤더: [←] 제목 + breadcrumb -->
    <header class="flex items-center gap-3">
      <BButton variant="outlined" color="info" size="sm" aria-label="뒤로" @click="onCancel">
        <ArrowLeft :size="20" />
      </BButton>
      <h1 class="text-2xl font-bold text-surface-900">{{ cTitle }}</h1>
      <nav class="flex items-center gap-1.5 text-sm text-surface-500">
        <span>영업</span>
        <ChevronRight :size="14" />
        <RouterLink to="/order-rsvs" class="hover:text-primary-600 hover:underline">
          예약 관리
        </RouterLink>
        <ChevronRight :size="14" />
        <span class="text-surface-700">{{ cTitle }}</span>
      </nav>
    </header>

    <!-- 본문: 좌측 그리드 + 우측 패널 -->
    <div class="flex min-h-0 flex-1 gap-6">
      <StoreGrid
        v-show="selStore == null"
        :stores="stores ?? []"
        :categories="storeCategories ?? []"
        :active="selStore == null"
        class="flex-1"
        @select="onSelectStore"
      />
      <MenuGrid
        v-show="selStore != null"
        :menus="menus ?? []"
        :categories="menuCategories ?? []"
        :active="selStore != null"
        class="flex-1"
        @add="onAddMenu"
      />

      <OrderRsvCartPanel
        v-model:memo="memo"
        v-model:rsv-at="rsvAt"
        :store="selStore"
        :items="cart"
        :is-editing="isEditing"
        @increment="orderRsvCartStore.increment"
        @decrement="orderRsvCartStore.decrement"
        @update-cnt="orderRsvCartStore.setCnt"
        @change-store="orderRsvCartStore.changeStore"
        @reset="orderRsvCartStore.reset"
        @cancel="onCancel"
        @save="onSave"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowLeft, ChevronRight } from 'lucide-vue-next'
import { useToast } from 'primevue/usetoast'

import { useMenuCtgsQuery } from '@/queries/menuCtgsQuery'
import { useMenusQuery } from '@/queries/menusQuery'
import { useOrderRsvCreateMutation, useOrderRsvUpdateMutation } from '@/queries/orderRsvsQuery'
import { useStoreCtgsQuery } from '@/queries/storeCtgsQuery'
import { useStoresQuery } from '@/queries/storesQuery'
import { useOrderRsvCartStore } from '@/stores/orderRsvCartStore'

const { data: menus } = useMenusQuery()
const { data: menuCategories } = useMenuCtgsQuery()
const { data: stores } = useStoresQuery()
const { data: storeCategories } = useStoreCtgsQuery()

const orderRsvCartStore = useOrderRsvCartStore()
const { selStore, cart, memo, rsvAt, isEditing, editingSeq } = storeToRefs(orderRsvCartStore)

const cTitle = computed(() => (isEditing.value ? '예약 수정' : '예약 추가'))

const router = useRouter()
const toast = useToast()
const { mutate: createRsv } = useOrderRsvCreateMutation()
const { mutate: updateRsv } = useOrderRsvUpdateMutation()

function onSelectStore(storeSeq: number) {
  const store = stores.value?.find((s) => s.seq === storeSeq)
  if (!store) return
  orderRsvCartStore.setStore(store)
}

function onAddMenu(menuSeq: number) {
  const menu = menus.value?.find((m) => m.seq === menuSeq)
  if (!menu) return
  orderRsvCartStore.addItem(menu)
}

function onSave() {
  if (!selStore.value || cart.value.length === 0 || !rsvAt.value) return
  const payload = {
    storeSeq: selStore.value.seq,
    rsvAt: rsvAt.value,
    cmt: memo.value || undefined,
    menus: cart.value.map(({ menuSeq, price, cnt }) => ({ menuSeq, price, cnt })),
  }

  if (isEditing.value && editingSeq.value != null) {
    updateRsv(
      { seq: editingSeq.value, payload },
      {
        onSuccess: () => {
          orderRsvCartStore.reset()
          toast.add({ severity: 'success', summary: '예약 수정 완료', life: 2000 })
          router.push('/order-rsvs')
        },
        // onError: 글로벌 인터셉터가 자동 토스트
      },
    )
    return
  }

  createRsv(payload, {
    onSuccess: () => {
      orderRsvCartStore.reset()
      toast.add({ severity: 'success', summary: '예약 등록', life: 2000 })
      router.push('/order-rsvs')
    },
    // onError: 글로벌 인터셉터가 자동 토스트
  })
}

function onCancel() {
  orderRsvCartStore.reset()
  router.push('/order-rsvs')
}
</script>
