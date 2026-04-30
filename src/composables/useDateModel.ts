import { format, parse } from 'date-fns'
import { computed, type Ref, type WritableComputedRef } from 'vue'

/**
 * 포맷 문자열 ref ↔ Date 양방향 변환 model.
 * DatePicker 등 Date 객체 v-model 컴포넌트와 string ref 사이 어댑터.
 *
 * @param source     포맷 문자열 ref. nullable 이면 `allowNull: true` 필수.
 * @param fmt        date-fns 포맷 — 'yyyy-MM-dd' / 'HH:mm:ss' 등
 * @param allowNull  true 면 set 에 null 들어올 때 ref 를 null 로. (default true — null set 무시)
 *
 * @example
 *   const startDt = defineModel<string>('startDt', { required: true })
 *   const mStartDt = useDateModel(startDt, 'yyyy-MM-dd')
 *
 *   const endDt = defineModel<string | null>('endDt', { required: true })
 *   const mEndDt = useDateModel(endDt, 'yyyy-MM-dd', true)
 */
export function useDateModel(
  source: Ref<string | null>,
  fmt: string,
  allowNull = true,
): WritableComputedRef<Date | null> {
  return computed<Date | null>({
    get: () => (source.value ? parse(source.value, fmt, new Date()) : null),
    set: (v) => {
      if (v instanceof Date) source.value = format(v, fmt)
      else if (allowNull) source.value = null
      // allowNull=false 면 null set 무시 — Ref<string> 의 약속 보호
    },
  })
}
