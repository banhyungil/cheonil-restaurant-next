<!-- 메뉴 추가/수정 통합 -->
<template>
  <section class="menus-edit-page flex h-full flex-col gap-5 bg-surface-50 px-8 py-6">
    <!-- 헤더: [←] 제목 + breadcrumb -->
    <header class="flex items-center gap-3">
      <BButton variant="outlined" color="info" size="sm" aria-label="뒤로" @click="onCancel">
        <ArrowLeft :size="20" />
      </BButton>
      <h1 class="text-2xl font-bold text-surface-900">{{ cTitle }}</h1>
      <nav class="flex items-center gap-1.5 text-sm text-surface-500">
        <span>관리</span>
        <ChevronRight :size="14" />
        <RouterLink to="/menus" class="hover:text-primary-600 hover:underline">
          메뉴 관리 목록
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
        <div class="flex flex-1 flex-col gap-1.5 max-w-80">
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

      <!-- row 2: 메뉴명 / 메뉴명 축약 -->
      <div class="flex gap-4">
        <div class="flex flex-1 flex-col gap-1.5 max-w-80">
          <label class="text-sm font-semibold text-surface-900">
            메뉴명 <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="nm"
            :invalid="!!nmError"
            placeholder="예: 김치찌개"
            @blur="onNmBlur"
            @update:model-value="nmError = ''"
          />
          <p v-if="nmError" class="text-xs text-red-600">{{ nmError }}</p>
        </div>

        <div class="flex flex-1 flex-col gap-1.5 max-w-80">
          <label class="text-sm font-semibold text-surface-900">
            메뉴명 축약 <span class="text-red-500">*</span>
          </label>
          <InputText v-model="nmS" maxlength="4" placeholder="예: 김치" />
          <p class="text-xs text-surface-500">주방 화면 / 면수표 등 좁은 곳에 표시 (최대 4자)</p>
        </div>
      </div>

      <!-- row 3: 가격 -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          가격 <span class="text-red-500">*</span>
        </label>
        <InputGroup class="max-w-80">
          <InputNumber v-model="price" :min="0" :max="99999" :step="1000" class="flex-1" />
          <InputGroupAddon>원</InputGroupAddon>
        </InputGroup>
      </div>

      <!-- row 4: 비고 -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-surface-900">
          비고 <span class="text-xs font-normal text-surface-500">(선택)</span>
        </label>
        <Textarea
          v-model="cmt"
          rows="3"
          placeholder="설명, 알레르기, 특이사항 등 자유 기재"
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
import type { MenuCreatePayload } from '@/apis/menusApi'
import { useMenuCtgsQuery } from '@/queries/menuCtgsQuery'
import { useMenuCreateMutation, useMenusQuery, useMenuUpdateMutation } from '@/queries/menusQuery'
import { useMenuFormStore } from '@/stores/menuFormStore'

const { data: categories } = useMenuCtgsQuery()
// 중복 검증용 — 비활성 포함 (unique 제약은 active 무관). 부모 KeepAlive 라 cache 공유 (추가 fetch X)
const { data: menusAll } = useMenusQuery(true)

const menuFormStore = useMenuFormStore()
const { ctgSeq, nm, nmS, price, cmt, active, isEditing, editingSeq } = storeToRefs(menuFormStore)

const cTitle = computed(() => (isEditing.value ? '메뉴 수정' : '메뉴 추가'))

const cCanSave = computed(
  () =>
    ctgSeq.value != null &&
    nm.value.trim().length > 0 &&
    nmS.value.trim().length > 0 &&
    price.value > 0,
)

/** 메뉴명 inline 에러 — 409 (중복) 응답 시 표시. nm 입력 변경 시 자동 clear. */
const nmError = ref('')

const router = useRouter()
const toast = useToast()
const { mutate: createMenu } = useMenuCreateMutation()
const { mutate: updateMenu } = useMenuUpdateMutation()

/** mutation 에러 핸들링 — 409 면 메뉴명 inline / 그 외는 컨텍스트 토스트. */
function handleSaveError(summary: string, e: unknown) {
  if (axios.isAxiosError(e) && e.response?.status === 409) {
    // backend 는 DB constraint raw 메시지를 줄 수 있어 프론트에서 사용자 친화 메시지로 고정
    nmError.value = '이미 사용 중인 메뉴명입니다'
    return
  }
  toast.add({ severity: 'error', summary, detail: getErrorMessage(e), life: 3000 })
}

function onSave() {
  if (!cCanSave.value || ctgSeq.value == null) return
  nmError.value = ''
  const payload: MenuCreatePayload = {
    ctgSeq: ctgSeq.value,
    nm: nm.value.trim(),
    nmS: nmS.value.trim(),
    price: price.value,
    cmt: cmt.value || undefined,
    active: active.value,
  }

  if (isEditing.value && editingSeq.value != null) {
    updateMenu(
      { seq: editingSeq.value, payload },
      {
        onSuccess: () => {
          menuFormStore.reset()
          toast.add({ severity: 'success', summary: '메뉴 수정 완료', life: 2500 })
          router.push('/menus')
        },
        onError: (e) => handleSaveError('메뉴 수정 실패', e),
      },
    )
    return
  }

  createMenu(payload, {
    onSuccess: () => {
      menuFormStore.reset()
      toast.add({ severity: 'success', summary: '메뉴 등록', life: 2500 })
      router.push('/menus')
    },
    onError: (e) => handleSaveError('메뉴 등록 실패', e),
  })
}

function onCancel() {
  menuFormStore.reset()
  router.push('/menus')
}

/**
 * 메뉴명 입력 blur 처리:
 * 1. 4글자 이상 + 축약 비어있으면 앞 두글자로 자동 채움
 * 2. 즉시 중복 검증 — load 된 menus list 에서 client-side 검사
 */
function onNmBlur() {
  if (nm.value.length >= 4 && !nmS.value.trim()) {
    nmS.value = nm.value.slice(0, 2)
  }

  const trimmed = nm.value.trim()
  if (!trimmed) {
    nmError.value = ''
    return
  }
  const dup = menusAll.value?.find((m) => m.nm === trimmed && m.seq !== editingSeq.value)
  nmError.value = dup ? '이미 존재하는 메뉴명입니다' : ''
}
</script>
