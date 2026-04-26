import { watch, type Ref } from 'vue'

/**
 * Focus 대상 — 네이티브 HTMLElement 또는 `$el` 을 노출하는 컴포넌트 인스턴스.
 */
type FocusableTarget = { $el?: HTMLElement } | HTMLElement | undefined

/**
 * activeRef 가 true 일 때 elRef 의 DOM 엘리먼트에 focus() 호출.
 * - 최초 마운트 시점: `immediate: true` 로 즉시 평가
 * - 이후 active 가 false → true 전환 시마다 재포커스
 * - v-show 로 감춰진 그리드가 다시 활성화되는 시나리오에 사용
 *
 * @param elt     input / 컴포넌트 ref
 * @param activeRef 활성화 신호 — ref 또는 getter
 */
export function useAutoFocus(
  elt: Ref<FocusableTarget>,
  isActive: Ref<boolean | undefined> | (() => boolean | undefined),
) {
  function doFocus() {
    nextTick(() => {
      const v = elt.value
      if (!v) return

      const target = v instanceof HTMLElement ? v : v.$el
      target?.focus()
    })
  }
  watch(
    isActive,
    (active) => {
      if (!active) return
      doFocus()
    },
    { immediate: true },
  )

  onActivated(() => {
    if (toValue(isActive)) doFocus()
  })
}
