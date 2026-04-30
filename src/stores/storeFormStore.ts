import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { Store } from '@/types/store'

/**
 * 매장 추가/수정 폼 draft 스토어.
 * - 신규: editingSeq = null
 * - 수정: editingSeq = 대상 매장 seq (목록 [수정] 에서 hydrate)
 *
 * `menuFormStore` 와 동일한 모드 분기 truth source 패턴.
 */
export const useStoreFormStore = defineStore('storeForm', () => {
  const ctgSeq = ref<number | null>(null)
  const nm = ref('')
  const addr = ref('')
  const cmt = ref('')
  const active = ref(true)
  const editingSeq = ref<number | null>(null)

  const isEditing = computed(() => editingSeq.value != null)

  function loadFromStore(s: Store) {
    ctgSeq.value = s.ctgSeq
    nm.value = s.nm
    addr.value = s.addr ?? ''
    cmt.value = s.cmt ?? ''
    active.value = s.active
    editingSeq.value = s.seq
  }

  function reset() {
    ctgSeq.value = null
    nm.value = ''
    addr.value = ''
    cmt.value = ''
    active.value = true
    editingSeq.value = null
  }

  return { ctgSeq, nm, addr, cmt, active, editingSeq, isEditing, loadFromStore, reset }
})
