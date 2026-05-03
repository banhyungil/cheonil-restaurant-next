<!-- 예약 템플릿 생성/수정 통합 -->
<template>
  <section class="order-rsv-tmpls-edit-page flex h-full flex-col gap-5 bg-surface-50 px-8 py-6">
    <!-- 헤더: [←] 제목 + breadcrumb -->
    <header class="flex items-center gap-3">
      <BButton variant="outlined" color="info" size="sm" aria-label="뒤로" @click="onCancel">
        <ArrowLeft :size="20" />
      </BButton>
      <h1 class="text-2xl font-bold text-surface-900">{{ cTitle }}</h1>
      <nav class="flex items-center gap-1.5 text-sm text-surface-500">
        <span>관리</span>
        <ChevronRight :size="14" />
        <RouterLink to="/order-rsv-tmpls" class="hover:text-primary-600 hover:underline">
          예약 템플릿
        </RouterLink>
        <ChevronRight :size="14" />
        <span class="text-surface-700">{{ cTitle }}</span>
      </nav>
    </header>

    <!-- 본문 -->
    <div class="flex min-h-0 flex-1 gap-6">
      <StoreGrid
        v-show="selStore == null"
        :stores="cSortedStores"
        :categories="cSortedStoreCtgs"
        :active="selStore == null"
        class="flex-1"
        @select="onSelectStore"
      />
      <MenuGrid
        v-show="selStore != null"
        :menus="cSortedMenus"
        :categories="cSortedMenuCtgs"
        :active="selStore != null"
        class="flex-1"
        @add="onAddMenu"
      />

      <OrderRsvTmplCartPanel
        v-model:nm="nm"
        v-model:day-types="dayTypes"
        v-model:rsv-time="rsvTime"
        v-model:start-dt="startDt"
        v-model:end-dt="endDt"
        v-model:cmt="cmt"
        v-model:active="active"
        v-model:auto-order="autoOrder"
        :store="selStore"
        :items="cart"
        :is-editing="isEditing"
        @increment="orderRsvTmplStore.increment"
        @decrement="orderRsvTmplStore.decrement"
        @update-cnt="orderRsvTmplStore.setCnt"
        @change-store="orderRsvTmplStore.changeStore"
        @reset="orderRsvTmplStore.reset"
        @cancel="onCancel"
        @save="onSave"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { ArrowLeft, ChevronRight } from 'lucide-vue-next'
import { useToast } from 'primevue/usetoast'

import type { RsvTmplCreatePayload } from '@/apis/orderRsvTmplsApi'
import { useSortedItems } from '@/composables/useSortedItems'
import { useMenuCtgsQuery } from '@/queries/menuCtgsQuery'
import { useMenusQuery } from '@/queries/menusQuery'
import {
  useOrderRsvTmplCreateMutation,
  useOrderRsvTmplUpdateMutation,
} from '@/queries/orderRsvTmplsQuery'
import { useSettingsQuery } from '@/queries/settingsQuery'
import { useStoreCtgsQuery } from '@/queries/storeCtgsQuery'
import { useStoresQuery } from '@/queries/storesQuery'
import { useOrderRsvTmplStore } from '@/stores/orderRsvTmplStore'
import type { Setting } from '@/types/setting'

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

// 정렬은 read-only — 변경은 영업 페이지(OrdersPage)에서만 가능
const cSortedStores = useSortedItems(stores, cOrderOf('STORE_ORDER'))
const cSortedMenus = useSortedItems(menus, cOrderOf('MENU_ORDER'))
const cSortedStoreCtgs = useSortedItems(storeCategories, cOrderOf('STORE_CATEGORY_ORDER'))
const cSortedMenuCtgs = useSortedItems(menuCategories, cOrderOf('MENU_CATEGORY_ORDER'))

const orderRsvTmplStore = useOrderRsvTmplStore()
const {
  selStore,
  cart,
  nm,
  dayTypes,
  rsvTime,
  startDt,
  endDt,
  cmt,
  active,
  autoOrder,
  isEditing,
  editingSeq,
} = storeToRefs(orderRsvTmplStore)

const cTitle = computed(() => (isEditing.value ? '예약 템플릿 수정' : '예약 템플릿 추가'))

// 신규 진입 시 default 값 — 수정 모드(loadFromTmpl) 면 이미 채워져 있어 건드리지 않음
onMounted(() => {
  if (!startDt.value) startDt.value = format(new Date(), 'yyyy-MM-dd')
  if (!rsvTime.value) rsvTime.value = '12:00:00'
})

const router = useRouter()
const toast = useToast()
const { mutate: createTmpl } = useOrderRsvTmplCreateMutation()
const { mutate: updateTmpl } = useOrderRsvTmplUpdateMutation()

function onSelectStore(storeSeq: number) {
  const store = stores.value?.find((s) => s.seq === storeSeq)
  if (!store) return
  orderRsvTmplStore.setStore(store)
}

function onAddMenu(menuSeq: number) {
  const menu = menus.value?.find((m) => m.seq === menuSeq)
  if (!menu) return
  orderRsvTmplStore.addItem(menu)
}

function onSave() {
  if (
    !selStore.value ||
    cart.value.length === 0 ||
    !nm.value.trim() ||
    dayTypes.value.length === 0 ||
    !rsvTime.value ||
    !startDt.value
  ) {
    return
  }

  const payload: RsvTmplCreatePayload = {
    storeSeq: selStore.value.seq,
    nm: nm.value.trim(),
    rsvTime: rsvTime.value,
    dayTypes: dayTypes.value,
    startDt: startDt.value,
    endDt: endDt.value,
    cmt: cmt.value || undefined,
    active: active.value,
    autoOrder: autoOrder.value,
    menus: cart.value.map(({ menuSeq, price, cnt }) => ({ menuSeq, price, cnt })),
  }

  if (isEditing.value && editingSeq.value != null) {
    updateTmpl(
      { seq: editingSeq.value, payload },
      {
        onSuccess: () => {
          orderRsvTmplStore.reset()
          toast.add({ severity: 'success', summary: '템플릿 수정 완료', life: 2000 })
          router.push('/order-rsv-tmpls')
        },
        // onError: 글로벌 인터셉터가 자동 토스트
      },
    )
    return
  }

  createTmpl(payload, {
    onSuccess: () => {
      orderRsvTmplStore.reset()
      toast.add({ severity: 'success', summary: '템플릿 등록', life: 2000 })
      router.push('/order-rsv-tmpls')
    },
    // onError: 글로벌 인터셉터가 자동 토스트
  })
}

function onCancel() {
  orderRsvTmplStore.reset()
  router.push('/order-rsv-tmpls')
}
</script>
