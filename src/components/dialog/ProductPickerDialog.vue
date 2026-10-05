<!-- 제품목록 팝업 — 제품 × 규격 선택. 열어둔 채로 여러 개 연속 선택 -->
<template>
  <Dialog
    :visible="visible"
    modal
    header="제품목록"
    :style="{ width: '440px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-3">
      <IconField>
        <InputIcon><Search :size="16" /></InputIcon>
        <BInputText v-model="keyword" placeholder="식자재 / 제품명 검색" class="w-full" autofocus />
      </IconField>

      <div class="flex max-h-96 flex-col gap-1 overflow-y-auto">
        <button
          v-for="opt in cOptions"
          :key="opt.key"
          type="button"
          class="flex items-center justify-between rounded-lg border border-surface-200 px-3 py-2.5 text-left hover:border-primary-300 hover:bg-primary-50"
          @click="emit('pick', opt.product, opt.unitCnt)"
        >
          <span class="flex flex-col">
            <span class="font-semibold text-surface-900">{{ opt.label }}</span>
            <span class="text-xs text-surface-500">{{ opt.product.ingdNm }}</span>
          </span>
          <Badge v-if="counts[opt.key]" :value="`${counts[opt.key]}개`" />
        </button>
        <p v-if="cOptions.length === 0" class="py-6 text-center text-sm text-surface-500">
          {{ keyword ? '검색 결과가 없습니다.' : '등록된 제품이 없습니다.' }}
        </p>
      </div>
      <p class="text-xs text-surface-500">
        누르면 구입목록에 추가되고, 같은 제품·규격을 다시 누르면 수량이 늘어납니다.
      </p>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'

import { useProductsQuery } from '@/queries/productsQuery'
import type { Product } from '@/types/product'
import { formatProductNm } from '@/utils/formatters'

defineProps<{
  visible: boolean
  /** 구입목록에 담긴 수량 — key `${prdSeq}:${unitCnt ?? ''}`. 선택 결과를 팝업 안에서 바로 보여준다. */
  counts: Record<string, number>
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  pick: [product: Product, unitCnt: number | null]
}>()

const { data: products } = useProductsQuery()
const keyword = ref('')

/** 제품 × 규격 펼침 — 규격이 없으면 한 줄(규격 null). */
const cOptions = computed(() => {
  const q = keyword.value.trim()
  return (products.value ?? [])
    .filter((p) => !q || p.ingdNm.includes(q) || p.nm.includes(q))
    .flatMap((p) =>
      (p.unitCnts.length > 0 ? p.unitCnts : [null]).map((unitCnt) => ({
        key: `${p.seq}:${unitCnt ?? ''}`,
        label: formatProductNm(p.nm, p.unitNm, unitCnt),
        product: p,
        unitCnt,
      })),
    )
})
</script>
