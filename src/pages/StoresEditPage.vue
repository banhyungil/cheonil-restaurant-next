<!-- 매장 추가/수정 통합 -->
<template>
  <section class="stores-edit-page flex h-full flex-col gap-5 bg-surface-50 px-8 py-6">
    <!-- 헤더: [←] 제목 + breadcrumb -->
    <header class="flex items-center gap-3">
      <BButton variant="outlined" color="info" size="sm" aria-label="뒤로" @click="onCancel">
        <ArrowLeft :size="20" />
      </BButton>
      <h1 class="text-2xl font-bold text-surface-900">{{ cTitle }}</h1>
      <nav class="flex items-center gap-1.5 text-sm text-surface-500">
        <span>관리</span>
        <ChevronRight :size="14" />
        <RouterLink to="/stores" class="hover:text-primary-600 hover:underline">
          매장 관리 목록
        </RouterLink>
        <ChevronRight :size="14" />
        <span class="text-surface-700">{{ cTitle }}</span>
      </nav>
    </header>

    <!-- 폼 본문 -->
    <div
      class="flex flex-col gap-4 overflow-auto rounded-xl border border-surface-200 bg-white p-6"
    >
      <!-- row 1: 카테고리 / 활성 -->
      <div class="flex gap-4">
        <div class="flex max-w-80 flex-1 flex-col gap-1.5">
          <label class="text-sm font-semibold text-surface-900">
            카테고리 <span class="text-red-500">*</span>
          </label>
          <Select
            v-model="ctgSeq"
            :options="categories ?? []"
            option-label="nm"
            option-value="seq"
            placeholder="카테고리 선택"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-surface-900">활성</label>
          <ToggleSwitch v-model="active" class="self-start" />
        </div>
      </div>

      <!-- row 2: 매장명 / 구역 -->
      <div class="flex gap-4">
        <div class="flex max-w-80 flex-1 flex-col gap-1.5">
          <label class="text-sm font-semibold text-surface-900">
            매장명 <span class="text-red-500">*</span>
          </label>
          <BInputText
            v-model="nm"
            :invalid="!!nmError"
            placeholder="예: 세림"
            @blur="onNmBlur"
            @update:model-value="nmError = ''"
          />
          <p v-if="nmError" class="text-xs text-red-600">{{ nmError }}</p>
        </div>

        <div class="flex max-w-80 flex-1 flex-col gap-1.5">
          <label class="text-sm font-semibold text-surface-900">주소</label>
          <BInputText v-model="addr" placeholder="예: 원예 6번지 · B동 3층" />
          <p class="text-xs text-surface-500">위치 정보 — 목록에서 매장 식별에 사용</p>
        </div>
      </div>

      <!-- row 3: 비고 -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          비고 <span class="text-xs font-normal text-surface-500">(선택)</span>
        </label>
        <Textarea
          v-model="cmt"
          rows="3"
          placeholder="영업시간 · 주차 · 특이사항 · 고객 특성 등 자유 기재"
          class="resize-none"
        />
      </div>
    </div>

    <!-- CTA -->
    <div class="flex justify-end gap-2">
      <BButton variant="outlined" color="secondary" @click="onCancel">취소</BButton>
      <BButton color="primary" :disabled="!cCanSave" @click="onSave">
        💾 {{ isEditing ? '수정 완료' : '저장' }}
      </BButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ArrowLeft, ChevronRight } from 'lucide-vue-next'
import { useToast } from 'primevue/usetoast'

import { getErrorMessage } from '@/apis/api'
import type { StoreCreatePayload } from '@/apis/storesApi'
import { useStoreCtgsQuery } from '@/queries/storeCtgsQuery'
import {
  useStoreCreateMutation,
  useStoresQuery,
  useStoreUpdateMutation,
} from '@/queries/storesQuery'
import { useStoreFormStore } from '@/stores/storeFormStore'

const { data: categories } = useStoreCtgsQuery()
// 중복 검증용 — 비활성 포함 (unique 제약은 active 무관). 부모 KeepAlive 라 cache 공유 (추가 fetch X)
const { data: storesAll } = useStoresQuery(true)

const storeFormStore = useStoreFormStore()
const { ctgSeq, nm, addr, cmt, active, isEditing, editingSeq } = storeToRefs(storeFormStore)

const cTitle = computed(() => (isEditing.value ? '매장 수정' : '매장 추가'))

const cCanSave = computed(() => ctgSeq.value != null && nm.value.trim().length > 0)

/** 매장명 inline 에러 — 409 (중복) 응답 시 / blur 검증에서 표시. nm 입력 변경 시 자동 clear. */
const nmError = ref('')

const router = useRouter()
const toast = useToast()
const { mutate: createStore } = useStoreCreateMutation()
const { mutate: updateStore } = useStoreUpdateMutation()

/** mutation 에러 핸들링 — 409 면 매장명 inline / 그 외는 컨텍스트 토스트. */
function handleSaveError(summary: string, e: unknown) {
  if (axios.isAxiosError(e) && e.response?.status === 409) {
    nmError.value = '이미 존재하는 매장명입니다'
    return
  }
  toast.add({ severity: 'error', summary, detail: getErrorMessage(e), life: 3000 })
}

function onSave() {
  if (!cCanSave.value || ctgSeq.value == null) return
  nmError.value = ''
  const payload: StoreCreatePayload = {
    ctgSeq: ctgSeq.value,
    nm: nm.value.trim(),
    addr: addr.value.trim() || undefined,
    cmt: cmt.value || undefined,
    active: active.value,
  }

  if (isEditing.value && editingSeq.value != null) {
    updateStore(
      { seq: editingSeq.value, payload },
      {
        onSuccess: () => {
          storeFormStore.reset()
          toast.add({ severity: 'success', summary: '매장 수정 완료', life: 2500 })
          router.push('/stores')
        },
        onError: (e) => handleSaveError('매장 수정 실패', e),
      },
    )
    return
  }

  createStore(payload, {
    onSuccess: () => {
      storeFormStore.reset()
      toast.add({ severity: 'success', summary: '매장 등록', life: 2500 })
      router.push('/stores')
    },
    onError: (e) => handleSaveError('매장 등록 실패', e),
  })
}

function onCancel() {
  storeFormStore.reset()
  router.push('/stores')
}

/** 매장명 입력 blur — 즉시 중복 검증 (load 된 stores list 에서 client-side 검사). */
function onNmBlur() {
  const trimmed = nm.value.trim()
  if (!trimmed) {
    nmError.value = ''
    return
  }
  const dup = storesAll.value?.find((s) => s.nm === trimmed && s.seq !== editingSeq.value)
  nmError.value = dup ? '이미 존재하는 매장명입니다' : ''
}
</script>
