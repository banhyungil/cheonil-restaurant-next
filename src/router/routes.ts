import AppLayout from '@/layouts/AppLayout.vue'
import OrdersPage from '@/pages/OrdersPage.vue'

// prettier-ignore
import {
  Blocks, BookOpen, Calculator, CalendarClock, CalendarDays, ClipboardList, Package, ReceiptText, Settings, Store, Utensils, Wallet,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

export const NAV_GROUPS = {
  SALES: '영업',
  SETTLEMENT: '정산',
  MANAGE: '관리',
  DEV: '개발',
} as const
export type NavGroup = (typeof NAV_GROUPS)[keyof typeof NAV_GROUPS]

export interface NavMeta {
  group: NavGroup
  label: string
  icon: Component
  order: number
  badge?: number
}

// type
declare module 'vue-router' {
  interface RouteMeta {
    nav?: NavMeta
  }
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    children: [
      // 주문 페이지를 루트로
      { path: '/', redirect: '/orders' },
      {
        path: 'orders',
        name: 'order',
        component: OrdersPage,
        meta: { nav: { group: NAV_GROUPS.SALES, label: '주문', icon: Utensils, order: 1 } },
      },
      {
        path: 'orders/monitor',
        name: 'orders-monitor',
        component: () => import('@/pages/OrdersMonitorPage.vue'),
        meta: {
          nav: { group: NAV_GROUPS.SALES, label: '주문현황', icon: ClipboardList, order: 2 },
        },
      },
      {
        path: 'order-rsvs',
        name: 'order-rsvs',
        component: () => import('@/pages/OrderRsvsPage.vue'),
        meta: {
          nav: {
            group: NAV_GROUPS.SALES,
            label: '예약 관리',
            icon: CalendarDays,
            order: 3,
            badge: 3,
          },
        },
      },
      {
        path: 'order-rsvs/edit',
        name: 'order-rsvs-edit',
        component: () => import('@/pages/OrderRsvsEditPage.vue'),
      },
      {
        path: 'settlement',
        name: 'settlement',
        component: () => import('@/pages/SettlementPage.vue'),
        meta: { nav: { group: NAV_GROUPS.SETTLEMENT, label: '정산', icon: Calculator, order: 1 } },
      },
      {
        path: 'sales',
        name: 'sales',
        component: () => import('@/pages/SalesPage.vue'),
        meta: { nav: { group: '관리', label: '주문내역관리', icon: ReceiptText, order: 1 } },
      },
      {
        path: 'expenses',
        name: 'expenses',
        component: () => import('@/pages/ExpensesPage.vue'),
        meta: { nav: { group: NAV_GROUPS.MANAGE, label: '지출내역', icon: Wallet, order: 2 } },
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('@/pages/ProductsPage.vue'),
        meta: { nav: { group: NAV_GROUPS.MANAGE, label: '제품 관리', icon: Package, order: 3 } },
      },
      {
        path: 'reservation-templates',
        name: 'order-rsv-tmpls',
        component: () => import('@/pages/OrderRsvTmplsPage.vue'),
        meta: {
          nav: { group: NAV_GROUPS.MANAGE, label: '예약 템플릿', icon: CalendarClock, order: 4 },
        },
      },
      {
        path: 'menus',
        name: 'menus',
        component: () => import('@/pages/MenusPage.vue'),
        meta: { nav: { group: NAV_GROUPS.MANAGE, label: '메뉴 관리', icon: BookOpen, order: 5 } },
      },
      {
        path: 'stores',
        name: 'stores',
        component: () => import('@/pages/StoresPage.vue'),
        meta: { nav: { group: NAV_GROUPS.MANAGE, label: '매장 관리', icon: Store, order: 6 } },
      },
      {
        path: 'master',
        name: 'master',
        component: () => import('@/pages/MasterPage.vue'),
        meta: { nav: { group: NAV_GROUPS.MANAGE, label: '마스터 관리', icon: Settings, order: 7 } },
      },
      {
        path: 'dev/components',
        name: 'dev-components',
        component: () => import('@/pages/dev/ComponentsPage.vue'),
        meta: { nav: { group: NAV_GROUPS.DEV, label: '공통 컴포넌트', icon: Blocks, order: 1 } },
      },
    ],
  },
  {
    path: '/examples/form',
    name: 'example-form',
    component: () => import('@/pages/examples/FormExamplePage.vue'),
  },
  {
    path: '/examples/css',
    name: 'example-css',
    component: () => import('@/pages/examples/CssExamplePage.vue'),
  },
]
