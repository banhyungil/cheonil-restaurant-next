import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { Menu } from '@/types/menu'

/**
 * 메뉴 추가/수정 폼 draft 스토어.
 * - 신규: editingSeq = null
 * - 수정: editingSeq = 대상 메뉴 seq (목록 [수정] 에서 hydrate)
 *
 * `OrderRsvCartStore` / `orderRsvTmplStore` 와 동일한 모드 분기 truth source 패턴.
 */
export const useMenuFormStore = defineStore('menuForm', () => {
  const ctgSeq = ref<number | null>(null)
  const nm = ref('')
  const nmS = ref('')
  const price = ref<number>(0)
  const cmt = ref('')
  const active = ref(true)
  const editingSeq = ref<number | null>(null)

  const isEditing = computed(() => editingSeq.value != null)

  function loadFromMenu(m: Menu) {
    ctgSeq.value = m.ctgSeq
    nm.value = m.nm
    nmS.value = m.nmS ?? ''
    price.value = m.price
    cmt.value = m.cmt ?? ''
    active.value = m.active
    editingSeq.value = m.seq
  }

  function reset() {
    ctgSeq.value = null
    nm.value = ''
    nmS.value = ''
    price.value = 0
    cmt.value = ''
    active.value = true
    editingSeq.value = null
  }

  return { ctgSeq, nm, nmS, price, cmt, active, editingSeq, isEditing, loadFromMenu, reset }
})
