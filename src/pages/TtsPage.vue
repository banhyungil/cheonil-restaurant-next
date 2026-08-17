<!--
  TTS 음성 관리 — 전역 음성 프로필 편집 + 서버 캐시에 쌓인 실제 발화 목록 확인.

  프로필은 draft 로 편집하고 [저장] 을 눌러야 useOrderAnnouncer 의 localStorage singleton 에
  반영된다 — 조정 중인 값이 곧바로 실제 주문 알림에 적용되면 매장 운영 중에 사고가 나기 때문.
  미리듣기는 draft 기준이라 저장 없이 얼마든지 들어볼 수 있다.
-->
<template>
  <section class="tts-page flex h-full flex-col gap-5 px-8 py-6">
    <header class="flex h-10 items-center gap-3">
      <h1 class="text-2xl font-bold text-surface-900">{{ route.meta.nav?.label }}</h1>
      <span class="text-base text-surface-500">
        · 주문 알림 음성 설정 — 실제 발화 문구로 들어보며 조정
      </span>
    </header>

    <!-- ─── 음성 프로필 ───────────────────────────────────────────── -->
    <section class="flex flex-col gap-3 rounded border border-surface-200 bg-white p-4">
      <div class="flex items-center gap-2">
        <h2 class="text-sm font-bold text-surface-800">음성 프로필</h2>
        <span class="text-xs text-surface-500"> 저장해야 주문 알림에 적용 (이 단말에만 저장) </span>
        <span
          v-if="isDirty"
          class="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800"
        >
          저장 안 됨
        </span>
      </div>

      <div class="flex flex-wrap items-end gap-5">
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium text-surface-600">화자</span>
          <Select
            v-model="draft.voice"
            :options="VOICE_OPTIONS"
            option-label="label"
            option-value="value"
            class="w-52"
          />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium text-surface-600">속도</span>
          <InputNumber
            v-model="draft.rate"
            :min="RATE_MIN"
            :max="RATE_MAX"
            :step="RATE_STEP"
            :min-fraction-digits="1"
            :max-fraction-digits="2"
            suffix="x"
            show-buttons
            button-layout="horizontal"
            :input-class="'w-18 text-center'"
          />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium text-surface-600">음량</span>
          <Select
            v-model="draft.gainDb"
            :options="GAIN_OPTIONS"
            option-label="label"
            option-value="value"
            class="w-32"
          />
        </label>
        <div class="flex-1" />
        <BButton
          variant="text"
          color="secondary"
          v-tooltip="'화자 Achernar / 속도 1.2x / 음량 보통'"
          @click="onResetProfile"
        >
          <RotateCcw :size="14" class="mr-1" />
          기본값
        </BButton>
        <BButton variant="outlined" color="secondary" :disabled="!isDirty" @click="onRevert">
          되돌리기
        </BButton>
        <BButton :disabled="!isDirty" @click="onSave">
          <Save :size="14" class="mr-1" />
          저장
        </BButton>
      </div>

      <div class="flex items-center gap-2">
        <BInputText
          v-model="testText"
          placeholder="테스트 문구 입력 후 Enter"
          :maxlength="PRESET_MAX_LEN"
          class="w-96"
          @keyup.enter="onSpeakTest"
        />
        <BButton :disabled="!testText.trim()" @click="onSpeakTest">
          <Play :size="14" class="mr-1" />
          발화
        </BButton>
      </div>
    </section>

    <!-- ─── 캐시 목록 ─────────────────────────────────────────────── -->
    <div class="flex min-h-0 flex-1 flex-col gap-3">
      <div class="flex items-center gap-3">
        <h2 class="text-sm font-bold text-surface-800">캐시된 음성</h2>
        <span class="text-xs text-surface-500">
          실제로 발화됐던 문구 —
          <template v-if="isFiltered">{{ cFilteredEntries.length }}건 표시 / </template>
          총 {{ entries.length }}건 / {{ formatSize(totalBytes) }}
        </span>
        <div class="flex-1" />

        <!-- 문구 검색 — 한글 자모/초성 매칭 (useSearchFilter) -->
        <IconField class="w-56">
          <InputIcon class="text-surface-500">
            <Search :size="16" />
          </InputIcon>
          <BInputText
            v-model="searchKeyword"
            placeholder="문구 검색"
            class="h-8.5 w-full"
            @keydown.esc="searchKeyword = ''"
          />
        </IconField>

        <Select
          v-model="filterVoice"
          :options="cVoiceFilterOptions"
          option-label="label"
          option-value="value"
          class="w-52"
        />

        <BButton
          variant="text"
          color="secondary"
          size="sm"
          :disabled="!isFiltered"
          v-tooltip="'필터 초기화'"
          @click="onResetFilter"
        >
          <FilterX :size="14" />
        </BButton>

        <BButton
          variant="outlined"
          color="secondary"
          size="sm"
          :loading="isFetching"
          @click="refetch()"
        >
          <RefreshCw :size="14" class="mr-1" />
          새로고침
        </BButton>
        <BButton
          variant="outlined"
          color="danger"
          size="sm"
          :disabled="selection.length === 0"
          @click="onDeleteSelected"
        >
          <Trash2 :size="14" class="mr-1" />
          선택 삭제{{ selection.length > 0 ? ` (${selection.length})` : '' }}
        </BButton>
      </div>

      <div v-if="error" class="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
        불러오기 실패: {{ getErrorMessage(error) }}
      </div>

      <!-- DataTable 이 자체 스크롤 처리 (scroll-height="flex"). min-h-0 + flex-1 로 영역만 확보 -->
      <div class="min-h-0 flex-1">
        <TtsCacheTable
          v-model:selection="selection"
          :entries="cFilteredEntries"
          :profile="draft"
          :empty-message="
            isFiltered
              ? '조건에 맞는 항목이 없습니다.'
              : '캐시된 음성이 없습니다. 위에서 문구를 발화하면 여기에 쌓입니다.'
          "
          @play="onPlayOriginal"
          @play-with-profile="onPlayWithProfile"
          @resynthesize="onResynthesize"
          @remove="onDelete"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { vTooltip } from 'floating-vue'
import { FilterX, Play, RefreshCw, RotateCcw, Save, Search, Trash2 } from 'lucide-vue-next'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import { getErrorMessage } from '@/apis/api'
import {
  deleteCacheEntries,
  deleteCacheEntry,
  fetchCacheList,
  type TtsCacheEntry,
} from '@/apis/ttsApi'
import {
  announcerGainDb,
  announcerRate,
  announcerVoice,
  GAIN_DB_DEFAULT,
  GAIN_OPTIONS,
  PRESET_MAX_LEN,
  RATE_DEFAULT,
  RATE_MAX,
  RATE_MIN,
  RATE_STEP,
  VOICE_DEFAULT,
  VOICE_OPTIONS,
} from '@/composables/useOrderAnnouncer'
import { useSearchFilter } from '@/composables/useSearchFilter'
import { QUERY_KEYS } from '@/queries/queryKeys'
import { clearAnnounceQueue, enqueueAnnounce, speakAsync } from '@/utils/announceQueue'

const route = useRoute()
const queryClient = useQueryClient()
const confirm = useConfirm()
const toast = useToast()

/**
 * 프로필 편집 draft.
 *
 * 저장 전까지 localStorage singleton(`announcerVoice` 등) 을 건드리지 않는다 — 조정 중인 값이
 * 곧바로 실제 주문 알림에 적용되면 매장 운영 중에 사고가 난다. 미리듣기는 draft 값으로 하므로
 * 저장 없이도 얼마든지 들어볼 수 있다.
 *
 * popover 쪽 설정은 여전히 즉시 반영 — 그쪽은 값 하나짜리 빠른 조작용이라 그대로 둔다.
 */
const draft = reactive({
  voice: announcerVoice.value,
  rate: announcerRate.value,
  gainDb: announcerGainDb.value,
})

const isDirty = computed(
  () =>
    draft.voice !== announcerVoice.value ||
    draft.rate !== announcerRate.value ||
    draft.gainDb !== announcerGainDb.value,
)

const { data, isFetching, error, refetch } = useQuery({
  queryKey: QUERY_KEYS.ttsCache,
  queryFn: fetchCacheList,
})

const entries = computed<TtsCacheEntry[]>(() => data.value ?? [])
const totalBytes = computed(() => entries.value.reduce((sum, e) => sum + e.sizeBytes, 0))

// ─── 목록 필터 ─────────────────────────────────────────────────────
// 전체 목록을 한 번에 받아오므로 클라이언트 필터. 서버 왕복 없음.

/** 화자 필터 '전체' sentinel — 빈 문자열은 Select 가 placeholder 로 취급해서 별도 값 사용. */
const VOICE_FILTER_ALL = 'ALL'

const searchKeyword = ref('')
const filterVoice = ref<string>(VOICE_FILTER_ALL)

/**
 * 화자 옵션 — 큐레이션 목록(VOICE_OPTIONS) 에 없는 화자도 캐시에는 남아 있을 수 있어
 * (기본값 변경 이력 등) 실제 데이터에 존재하는 값을 합쳐서 만든다. 건수도 함께 표시.
 */
const cVoiceFilterOptions = computed(() => {
  const counts = new Map<string, number>()
  for (const e of entries.value) counts.set(e.voice, (counts.get(e.voice) ?? 0) + 1)

  const known = VOICE_OPTIONS.filter((o) => counts.has(o.value)).map((o) => ({
    label: `${o.label} (${counts.get(o.value)})`,
    value: o.value,
  }))
  const unknown = [...counts.keys()]
    .filter((v) => !VOICE_OPTIONS.some((o) => o.value === v))
    .map((v) => ({ label: `${v} (${counts.get(v)})`, value: v }))

  return [
    { label: `전체 화자 (${entries.value.length})`, value: VOICE_FILTER_ALL },
    ...known,
    ...unknown,
  ]
})

const cByVoice = computed(() =>
  filterVoice.value === VOICE_FILTER_ALL
    ? entries.value
    : entries.value.filter((e) => e.voice === filterVoice.value),
)

/** 문구 like 검색 — 한글 자모/초성 매칭 지원 (예: "ㄱㅊ" → "김치찌개..."). */
const { cFiltered: cFilteredEntries } = useSearchFilter(cByVoice, searchKeyword, (e) => e.text)

const isFiltered = computed(
  () => searchKeyword.value.trim() !== '' || filterVoice.value !== VOICE_FILTER_ALL,
)

function onResetFilter() {
  searchKeyword.value = ''
  filterVoice.value = VOICE_FILTER_ALL
}

function invalidate() {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ttsCache })
}

// ─── 선택 ──────────────────────────────────────────────────────────

const selection = ref<TtsCacheEntry[]>([])

/**
 * 화면에서 사라진 행은 선택도 해제 — 필터로 가려진 항목이 "선택 N건 삭제" 에 딸려가면
 * 보이지 않는 데이터가 지워진다. 목록 refetch 로 없어진 항목도 같이 정리된다.
 */
watch(cFilteredEntries, (visible) => {
  const visibleKeys = new Set(visible.map((e) => e.key))
  if (selection.value.some((e) => !visibleKeys.has(e.key))) {
    selection.value = selection.value.filter((e) => visibleKeys.has(e.key))
  }
})

// ─── 프로필 ────────────────────────────────────────────────────────

const testText = ref('')

/** 편집 중인 draft 로 테스트 발화 — 저장 전에 들어보기 위한 것이므로 draft 기준이 맞다. */
function onSpeakTest() {
  const text = testText.value.trim()
  if (!text) return
  speak(text, draft.voice, draft.rate, draft.gainDb)
}

/** draft 만 기본값으로 되돌린다 — 저장은 사용자가 명시적으로. */
function onResetProfile() {
  draft.voice = VOICE_DEFAULT
  draft.rate = RATE_DEFAULT
  draft.gainDb = GAIN_DB_DEFAULT
}

/** 편집 취소 — 저장된 값으로 draft 복구. */
function onRevert() {
  draft.voice = announcerVoice.value
  draft.rate = announcerRate.value
  draft.gainDb = announcerGainDb.value
}

/** 여기서 처음으로 localStorage singleton 에 반영 — 이 시점부터 실제 주문 알림에 적용된다. */
function onSave() {
  announcerVoice.value = draft.voice
  announcerRate.value = draft.rate
  announcerGainDb.value = draft.gainDb
  toast.add({ severity: 'success', summary: '음성 프로필 저장', life: 2000 })
}

// ─── 캐시 목록 ─────────────────────────────────────────────────────

/** 캐시된 그 음성 그대로 — 행의 파라미터로 발화하므로 서버 캐시 hit. */
function onPlayOriginal(row: TtsCacheEntry) {
  speak(row.text, row.voice, row.speed, row.gainDb)
}

/** 같은 문구를 편집 중인 draft 로 — 파라미터가 다르면 새 캐시 항목이 생긴다. */
function onPlayWithProfile(row: TtsCacheEntry) {
  speak(row.text, draft.voice, draft.rate, draft.gainDb)
}

/**
 * 서버 캐시 삭제 후 같은 파라미터로 강제 재합성 — 이 경로만 실제로 Google 을 다시 호출한다.
 *
 * 삭제를 발화와 같은 큐 작업으로 묶어, 삭제만 되고 재합성이 누락되는 상태가 남지 않게 한다.
 */
function onResynthesize(row: TtsCacheEntry) {
  speak(row.text, row.voice, row.speed, row.gainDb, {
    before: () => deleteCacheEntry(row.key),
  })
}

async function onDelete(row: TtsCacheEntry) {
  await deleteCacheEntry(row.key)
  selection.value = selection.value.filter((e) => e.key !== row.key)
  invalidate()
}

/** 체크한 항목 일괄 삭제. 파괴적이라 확인 다이얼로그를 거친다. */
function onDeleteSelected() {
  const targets = selection.value
  if (targets.length === 0) return

  confirm.require({
    message: `선택한 ${targets.length}건의 캐시를 삭제합니다.\n다음 발화 때 다시 합성되므로 데이터 유실은 없습니다.`,
    header: '캐시 삭제',
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      await deleteCacheEntries(targets.map((e) => e.key))
      selection.value = []
      invalidate()
      toast.add({ severity: 'success', summary: `캐시 ${targets.length}건 삭제`, life: 2000 })
    },
  })
}

// ─── 발화 공통 ─────────────────────────────────────────────────────

/**
 * 모든 발화는 알림 큐 경유 — 주문 알림과 직렬화되어 사운드가 겹치지 않는다.
 *
 * 이 페이지의 발화는 **항상 `bypassCache`** — 메모리/브라우저 캐시에서 반환되면 요청이 서버에 닿지
 * 않아 목록의 "마지막 사용"(mp3 mtime) 이 갱신되지 않고, 화면이 실제 서버 상태와 어긋난다.
 * 서버 캐시는 그대로 hit 하므로 Google 재호출은 없다 (왕복 한 번만 추가).
 *
 * 발화 후 목록을 항상 refetch 한다 — 새 파라미터면 항목이 늘고, 재합성이면 되살아나기 때문.
 * 실패해도 refetch 해야 화면이 실제 서버 상태와 어긋나지 않는다.
 */
function speak(
  text: string,
  v: string,
  speed: number,
  gain: number,
  opts: { before?: () => Promise<unknown> } = {},
) {
  enqueueAnnounce(async () => {
    try {
      await opts.before?.()
      await speakAsync(text, {
        voice: v,
        rate: speed,
        gainDb: gain,
        bypassCache: true,
        onError: (e) =>
          toast.add({
            severity: 'error',
            summary: '발화 실패',
            detail: getErrorMessage(e),
            life: 4000,
          }),
      })
    } finally {
      invalidate()
    }
  })
}

onUnmounted(clearAnnounceQueue)

// ─── 표시 헬퍼 ─────────────────────────────────────────────────────

/** 헤더의 총 용량 표기용 — 행 단위 포맷은 TtsCacheTable 이 담당. */
function formatSize(bytes: number) {
  return bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}KB`
}
</script>
