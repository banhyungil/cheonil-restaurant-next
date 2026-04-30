<!-- 메뉴 관리 테이블 -->
<template>
  <DataTable
    class="menu-table"
    :value="menus"
    striped-rows
    data-key="seq"
    :pt="{ thead: { class: 'bg-surface-50' } }"
  >
    <Column field="nm" header="메뉴명">
      <template #body="{ data }">
        <div class="font-semibold text-surface-900">{{ data.nm }}</div>
        <div v-if="data.nmS" class="text-sm text-surface-500">{{ data.nmS }}</div>
      </template>
    </Column>

    <Column header="카테고리">
      <template #body="{ data }">
        <span class="rounded bg-primary-50 px-2 py-0.5 text-base text-primary-700">
          {{ cCtgNameByCtgSeq[data.ctgSeq] ?? '-' }}
        </span>
      </template>
    </Column>

    <Column field="price" header="가격">
      <template #body="{ data }">
        <span class="font-semibold">{{ data.price.toLocaleString() }}원</span>
      </template>
    </Column>

    <Column header="표시여부">
      <template #body="{ data }">
        <ToggleSwitch
          :model-value="data.active"
          @update:model-value="(v: boolean) => emit('toggle-active', data.seq, v)"
        />
      </template>
    </Column>

    <Column field="regAt" header="등록일">
      <template #body="{ data }">
        <span class="text-sm text-surface-600">
          {{ data.regAt ? format(new Date(data.regAt), 'yyyy.MM.dd') : '-' }}
        </span>
      </template>
    </Column>

    <Column field="modAt" header="최근 수정">
      <template #body="{ data }">
        <span class="text-sm text-surface-600">
          {{ data.modAt ? format(new Date(data.modAt), 'yyyy.MM.dd') : '-' }}
        </span>
      </template>
    </Column>

    <Column header="작업">
      <template #body="{ data }">
        <div class="flex gap-1">
          <BButton
            v-tooltip="'수정'"
            variant="outlined"
            color="secondary"
            size="sm"
            @click="emit('edit', data.seq)"
          >
            <SquarePen :size="14" />
          </BButton>
          <BButton
            v-tooltip="'삭제'"
            variant="outlined"
            color="danger"
            size="sm"
            @click="emit('remove', data.seq)"
          >
            <Trash2 :size="14" />
          </BButton>
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { vTooltip } from 'floating-vue'
import { SquarePen, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

import type { Menu, MenuCategory } from '@/types/menu'

const props = defineProps<{
  menus: readonly Menu[]
  categories: readonly MenuCategory[]
}>()

const emit = defineEmits<{
  edit: [seq: number]
  remove: [seq: number]
  'toggle-active': [seq: number, active: boolean]
}>()

const cCtgNameByCtgSeq = computed(
  () => Object.fromEntries(props.categories.map((c) => [c.seq, c.nm])) as Record<number, string>,
)
</script>
