<!-- TTS 서버 캐시 목록 테이블 -->
<template>
  <DataTable
    class="tts-cache-table"
    :value="entries"
    data-key="key"
    striped-rows
    scrollable
    scroll-height="flex"
    :selection="selection"
    :row-class="(d: TtsCacheEntry) => (isCurrentProfile(d) ? 'bg-primary-50!' : '')"
    :pt="{ thead: { class: 'bg-surface-50' } }"
    @update:selection="emit('update:selection', $event as TtsCacheEntry[])"
  >
    <Column selection-mode="multiple" :pt="{ headerCell: { style: 'width:3rem' } }" />

    <Column field="text" header="문구">
      <template #body="{ data }">
        <span class="text-surface-900">{{ data.text }}</span>
      </template>
    </Column>

    <Column field="voice" header="화자" sortable>
      <template #body="{ data }">
        <span class="text-sm text-surface-600">{{ voiceLabel(data.voice) }}</span>
      </template>
    </Column>

    <Column field="speed" header="속도" sortable>
      <template #body="{ data }">
        <span class="text-sm text-surface-600">{{ data.speed }}x</span>
      </template>
    </Column>

    <Column field="gainDb" header="음량">
      <template #body="{ data }">
        <span class="text-sm text-surface-600">{{ gainLabel(data.gainDb) }}</span>
      </template>
    </Column>

    <Column field="sizeBytes" header="크기" sortable>
      <template #body="{ data }">
        <span class="text-sm text-surface-600">{{ formatSize(data.sizeBytes) }}</span>
      </template>
    </Column>

    <Column field="lastUsedAt" header="마지막 사용" sortable>
      <template #body="{ data }">
        <span class="text-sm text-surface-600">{{ formatDateTime(data.lastUsedAt) }}</span>
      </template>
    </Column>

    <Column header="작업">
      <template #body="{ data }">
        <div class="flex gap-1">
          <BButton
            v-tooltip="'캐시된 음성 그대로 재생'"
            variant="outlined"
            color="secondary"
            size="sm"
            @click="emit('play', data)"
          >
            <Play :size="14" />
          </BButton>
          <BButton
            v-tooltip="'편집 중인 설정으로 이 문구 발화'"
            variant="outlined"
            color="secondary"
            size="sm"
            :disabled="isCurrentProfile(data)"
            @click="emit('play-with-profile', data)"
          >
            <Wand2 :size="14" />
          </BButton>
          <BButton
            v-tooltip="'캐시 삭제 후 같은 설정으로 재합성 (Google 재호출)'"
            variant="outlined"
            color="secondary"
            size="sm"
            @click="emit('resynthesize', data)"
          >
            <RefreshCw :size="14" />
          </BButton>
          <BButton
            v-tooltip="'캐시 삭제'"
            variant="outlined"
            color="danger"
            size="sm"
            @click="emit('remove', data)"
          >
            <Trash2 :size="14" />
          </BButton>
        </div>
      </template>
    </Column>

    <template #empty>
      <div class="py-8 text-center text-sm text-surface-500">{{ emptyMessage }}</div>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { vTooltip } from 'floating-vue'
import { Play, RefreshCw, Trash2, Wand2 } from 'lucide-vue-next'

import type { TtsCacheEntry } from '@/apis/ttsApi'
import { GAIN_OPTIONS, VOICE_OPTIONS } from '@/composables/useOrderAnnouncer'

const props = withDefaults(
  defineProps<{
    entries: readonly TtsCacheEntry[]
    /** 편집 중인 프로필 — 같은 파라미터인 행을 하이라이트하고 중복 발화 버튼을 막는다. */
    profile: { voice: string; rate: number; gainDb: number }
    /** 체크된 행 (v-model:selection). */
    selection?: TtsCacheEntry[]
    /** 빈 상태 문구 — 필터 때문에 0건인지 원래 0건인지 호출부만 알 수 있어 주입받는다. */
    emptyMessage?: string
  }>(),
  { selection: () => [], emptyMessage: '캐시된 음성이 없습니다.' },
)

const emit = defineEmits<{
  'update:selection': [entries: TtsCacheEntry[]]
  play: [entry: TtsCacheEntry]
  'play-with-profile': [entry: TtsCacheEntry]
  resynthesize: [entry: TtsCacheEntry]
  remove: [entry: TtsCacheEntry]
}>()

function isCurrentProfile(row: TtsCacheEntry) {
  return (
    row.voice === props.profile.voice &&
    row.speed === props.profile.rate &&
    row.gainDb === props.profile.gainDb
  )
}

function voiceLabel(value: string) {
  return VOICE_OPTIONS.find((o) => o.value === value)?.label ?? value
}

function gainLabel(value: number) {
  return GAIN_OPTIONS.find((o) => o.value === value)?.label ?? `${value}dB`
}

function formatSize(bytes: number) {
  return bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}KB`
}

function formatDateTime(iso: string) {
  try {
    return format(new Date(iso), 'MM-dd HH:mm')
  } catch {
    return iso
  }
}
</script>
