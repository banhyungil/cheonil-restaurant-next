<!-- 단축키 도움말 다이얼로그 — Ctrl+/ 로 호출. -->
<template>
  <Dialog v-model:visible="visible" modal header="단축키" :style="{ width: '520px' }">
    <div class="shortcuts-help-dialog flex flex-col gap-5">
      <section v-for="group in SHORTCUT_GROUPS" :key="group.label" class="flex flex-col gap-2">
        <h3 class="text-sm font-semibold text-surface-500">{{ group.label }}</h3>
        <ul class="flex flex-col">
          <li
            v-for="item in group.items"
            :key="item.desc"
            class="flex items-center gap-3 border-b border-surface-100 py-2 last:border-b-0"
          >
            <span class="flex flex-1 items-center gap-2">
              <span class="text-base text-surface-900">{{ item.desc }}</span>
              <span v-if="item.scope" class="text-xs text-surface-500">— {{ item.scope }}</span>
            </span>
            <span class="flex items-center gap-1">
              <template v-for="(key, i) in item.keys" :key="key">
                <kbd
                  class="inline-flex h-6 min-w-6 items-center justify-center rounded border border-surface-300 bg-surface-50 px-1.5 text-xs font-semibold text-surface-700"
                >
                  {{ key }}
                </kbd>
                <span v-if="i < item.keys.length - 1" class="text-xs text-surface-400">+</span>
              </template>
            </span>
          </li>
        </ul>
      </section>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
interface Shortcut {
  keys: string[]
  desc: string
  /** 적용 페이지/맥락 (전역이면 생략). */
  scope?: string
}

const visible = defineModel<boolean>('visible', { required: true })

const SHORTCUT_GROUPS: { label: string; items: Shortcut[] }[] = [
  {
    label: '페이지 이동',
    items: [
      { keys: ['Alt', '1'], desc: '주문' },
      { keys: ['Alt', '2'], desc: '주문현황' },
    ],
  },
  {
    label: '주문',
    items: [{ keys: ['Ctrl', 'Shift', 'Space'], desc: '주문 접수', scope: '주문 페이지' }],
  },
  {
    label: '레이아웃',
    items: [{ keys: ['Ctrl', 'B'], desc: '사이드바 토글' }],
  },
  {
    label: '도움말',
    items: [{ keys: ['Ctrl', '/'], desc: '단축키 보기' }],
  },
]
</script>
