<!-- 예약 생성/수정 통합 -->
<template>
  <div class="order-rsvs-edit-page flex h-full gap-6 bg-surface-50 px-8 py-6">
    <!-- 좌측: 매장 미선택 → StoreGrid, 선택됨 → MenuGrid -->
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

    <!-- 우측: 예약 정보 패널 -->
    <RsvInfoPanel
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
</template>

<script setup lang="ts">
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
        onError: () =>
          toast.add({
            severity: 'error',
            summary: '수정 실패',
            detail: '잠시 후 다시 시도해주세요',
            life: 3000,
          }),
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
    onError: () =>
      toast.add({
        severity: 'error',
        summary: '등록 실패',
        detail: '잠시 후 다시 시도해주세요',
        life: 3000,
      }),
  })
}

function onCancel() {
  orderRsvCartStore.reset()
  router.push('/order-rsvs')
}
</script>
