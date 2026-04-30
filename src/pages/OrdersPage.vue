<!-- 주문 -->
<template>
  <div class="orders-page flex h-full gap-6 bg-surface-50 px-8 py-6">
    <!-- Left: 매장 미선택 → StoreGrid, 선택됨 → MenuGrid
         v-show 로 둘 다 마운트 유지 → 매장 재선택 시 MenuGrid 내부 filter/search state 보존 -->
    <StoreGrid
      v-show="selStore == null"
      :stores="cSortedStores"
      :categories="cSortedStoreCtgs"
      :active="selStore == null"
      sortable
      class="flex-1"
      @select="onSelectStore"
      @reorder="onReorderStores"
      @reorder-categories="onReorderStoreCtgs"
    />
    <MenuGrid
      v-show="selStore != null"
      :menus="cSortedMenus"
      :categories="cSortedMenuCtgs"
      :active="selStore != null"
      sortable
      class="flex-1"
      @add="onAddMenu"
      @reorder="onReorderMenus"
      @reorder-categories="onReorderMenuCtgs"
    />

    <!-- Right: 카트 패널 (상태별 자동 분기) -->
    <OrderCartPanel
      v-model:memo="memo"
      :store="selStore"
      :items="cart"
      :is-editing="isEditing"
      @increment="orderCartStore.increment"
      @decrement="orderCartStore.decrement"
      @update-cnt="orderCartStore.setCnt"
      @change-store="orderCartStore.changeStore"
      @reset="orderCartStore.reset"
      @order="onOrder"
    />
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

import { useSortedItems } from '@/composables/useSortedItems'
import { useMenuCtgsQuery } from '@/queries/menuCtgsQuery'
import { useMenusQuery } from '@/queries/menusQuery'
import { useOrderCreateMutation, useOrderUpdateMutation } from '@/queries/ordersQuery'
import { useSettingUpdateMutation, useSettingsQuery } from '@/queries/settingsQuery'
import { useStoreCtgsQuery } from '@/queries/storeCtgsQuery'
import { useStoresQuery } from '@/queries/storesQuery'
import { useOrderCartStore } from '@/stores/orderCartStore'
import type { OrderConfig, Setting } from '@/types/setting'

// 서버 데이터 — vue-query 가 캐싱·재검증·dedup 자동 처리
const { data: menus } = useMenusQuery()
const { data: menuCategories } = useMenuCtgsQuery()
const { data: stores } = useStoresQuery()
const { data: storeCategories } = useStoreCtgsQuery()
const { data: settings } = useSettingsQuery()

// 정렬: settings 의 *_ORDER 적용 — 매장/메뉴/카테고리 4종
const cOrderOf = <C extends 'STORE_ORDER' | 'MENU_ORDER' | 'STORE_CATEGORY_ORDER' | 'MENU_CATEGORY_ORDER'>(
  code: C,
) =>
  computed(
    () =>
      (settings.value?.find((s): s is Setting<C> => s.code === code)?.effectiveConfig.order as
        | number[]
        | undefined) ?? [],
  )

const cSortedStores = useSortedItems(stores, cOrderOf('STORE_ORDER'))
const cSortedMenus = useSortedItems(menus, cOrderOf('MENU_ORDER'))
const cSortedStoreCtgs = useSortedItems(storeCategories, cOrderOf('STORE_CATEGORY_ORDER'))
const cSortedMenuCtgs = useSortedItems(menuCategories, cOrderOf('MENU_CATEGORY_ORDER'))

const { mutate: updateStoreOrder } = useSettingUpdateMutation<'STORE_ORDER'>()
const { mutate: updateMenuOrder } = useSettingUpdateMutation<'MENU_ORDER'>()
const { mutate: updateStoreCtgOrder } = useSettingUpdateMutation<'STORE_CATEGORY_ORDER'>()
const { mutate: updateMenuCtgOrder } = useSettingUpdateMutation<'MENU_CATEGORY_ORDER'>()

function onReorderStores(seqs: number[]) {
  const userConfig: OrderConfig = { order: seqs }
  updateStoreOrder({ code: 'STORE_ORDER', userConfig })
}
function onReorderMenus(seqs: number[]) {
  const userConfig: OrderConfig = { order: seqs }
  updateMenuOrder({ code: 'MENU_ORDER', userConfig })
}
function onReorderStoreCtgs(seqs: number[]) {
  const userConfig: OrderConfig = { order: seqs }
  updateStoreCtgOrder({ code: 'STORE_CATEGORY_ORDER', userConfig })
}
function onReorderMenuCtgs(seqs: number[]) {
  const userConfig: OrderConfig = { order: seqs }
  updateMenuCtgOrder({ code: 'MENU_CATEGORY_ORDER', userConfig })
}

// 주문 작성 draft — Pinia로 상태 보존 (수정 모드 진입 시 다른 페이지에서 hydrate)
const orderCartStore = useOrderCartStore()
const { selStore, cart, memo, isEditing, editingSeq } = storeToRefs(orderCartStore)

// 주문 생성/수정 — WS 도입 후엔 mutation은 호출만, 캐시 갱신은 WS 담당
const router = useRouter()
const toast = useToast()
const { mutate: createOrder } = useOrderCreateMutation()
const { mutate: updateOrder } = useOrderUpdateMutation()

function onSelectStore(storeSeq: number) {
  const store = stores.value?.find((s) => s.seq === storeSeq)
  if (!store) return
  orderCartStore.setStore(store)
}

function onAddMenu(menuSeq: number) {
  const menu = menus.value?.find((m) => m.seq === menuSeq)
  if (!menu) return
  orderCartStore.addItem(menu)
}

function onOrder() {
  if (!selStore.value || cart.value.length === 0) return
  const payload = {
    storeSeq: selStore.value.seq,
    cmt: memo.value || undefined,
    menus: cart.value.map(({ menuSeq, price, cnt }) => ({ menuSeq, price, cnt })),
  }

  if (isEditing.value && editingSeq.value != null) {
    updateOrder(
      { seq: editingSeq.value, payload },
      {
        onSuccess: () => {
          orderCartStore.reset()
          toast.add({ severity: 'success', summary: '주문 수정 완료', life: 2000 })
          router.push('/orders/monitor')
        },
        onError: () => {
          toast.add({
            severity: 'error',
            summary: '수정 실패',
            detail: '잠시 후 다시 시도해주세요',
            life: 3000,
          })
        },
      },
    )
    return
  }

  createOrder(payload, {
    onSuccess: () => {
      orderCartStore.reset()
      toast.add({ severity: 'success', summary: '주문 접수', life: 2000 })
      // router.push('/orders/monitor')
    },
    onError: () => {
      toast.add({
        severity: 'error',
        summary: '주문 실패',
        detail: '잠시 후 다시 시도해주세요',
        life: 3000,
      })
    },
  })
}
</script>
