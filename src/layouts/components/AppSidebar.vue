<template>
  <aside
    class="flex h-screen shrink-0 flex-col border border-surface-200 bg-surface-0 py-4 transition-[width] duration-200 ease-out"
    :class="collapsed ? 'w-16 px-2' : 'w-55 px-3'"
  >
    <!-- Header -->
    <div
      class="flex h-14 items-center"
      :class="collapsed ? 'justify-center' : 'justify-between pl-1.5'"
    >
      <div v-if="!collapsed" class="flex h-10 items-center gap-2">
        <UtensilsCrossed :size="22" class="text-primary-500" />
        <span class="text-lg font-bold text-primary-500">천일식당</span>
      </div>
      <Button
        severity="secondary"
        :size="collapsed ? undefined : 'small'"
        :aria-label="collapsed ? '사이드바 펼치기' : '사이드바 접기'"
        @click="collapsed = !collapsed"
      >
        <template #icon>
          <Menu v-if="collapsed" :size="18" />
          <ChevronsLeft v-else :size="16" />
        </template>
      </Button>
    </div>

    <div class="h-6 shrink-0" />

    <!-- Nav groups -->
    <template v-for="group in navGroups" :key="group.label">
      <div v-if="!collapsed" class="flex h-7 items-center pl-2">
        <span class="text-sm font-semibold text-surface-500">{{ group.label }}</span>
      </div>
      <div v-else class="flex h-3 items-center justify-center">
        <div class="h-px w-6 bg-surface-200" />
      </div>

      <RouterLink
        v-for="item in group.items"
        :key="item.name"
        v-slot="{ isExactActive, navigate }"
        :to="item.to"
        custom
      >
        <a
          class="flex h-11 cursor-pointer items-center overflow-hidden rounded-lg"
          :class="[
            collapsed ? 'justify-center' : 'gap-3 px-3',
            isExactActive ? 'bg-primary-500 text-white' : 'text-surface-900 hover:bg-surface-50',
          ]"
          @click="navigate"
        >
          <component :is="item.icon" :size="20" class="shrink-0" />
          <template v-if="!collapsed">
            <span class="text-base" :class="isExactActive ? 'font-semibold' : 'font-medium'">{{
              item.label
            }}</span>
            <Badge v-if="item.badge !== undefined" :value="item.badge" class="ml-auto"> </Badge>
          </template>
        </a>
      </RouterLink>

      <div class="h-3 shrink-0" />
    </template>

    <div class="flex-1" />

    <!-- Footer -->
    <div
      class="flex h-12 shrink-0 items-center rounded-lg bg-surface-50"
      :class="collapsed ? 'justify-center' : 'gap-2.5 px-2.5'"
    >
      <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-500">
        <span class="text-sm font-bold text-white">관</span>
      </div>
      <div v-if="!collapsed" class="flex flex-col">
        <span class="text-sm font-semibold text-surface-900">관리자</span>
        <span class="text-xs text-surface-500">로그아웃</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ChevronsLeft, Menu, UtensilsCrossed } from 'lucide-vue-next'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import _ from 'lodash'
import { NAV_GROUPS } from '@/router/routes'

const router = useRouter()
const collapsed = ref(false)

const navItems = router.getRoutes().flatMap((route) => {
  if (!route.meta.nav || typeof route.name !== 'string') return []
  return [{ ...route.meta.nav, name: route.name, to: route.path }]
})

const navGroups = _.map(NAV_GROUPS)
  .map((group) => ({
    label: group,
    items: navItems.filter((item) => item.group === group).sort((a, b) => a.order - b.order),
  }))
  .filter((g) => g.items.length > 0)
</script>
