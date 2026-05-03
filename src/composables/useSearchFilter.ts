import { refDebounced } from '@vueuse/core'
import { divideByJong, hangulIncludes, includesByCho, isCho, isJong } from 'hangul-util'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

/** 기본 debounce — 한글 IME composition 종료 + 빈 키워드로 폭증하는 리스트 재렌더 비용 완화. */
const DEFAULT_DEBOUNCE_MS = 200

/**
 * 리스트 키워드 필터링 (한글 자모/초성 검색 지원).
 *
 * 매칭 규칙:
 * 1. 일반 매칭 — `hangulIncludes` 가 한글 자모 단위까지 포함 여부 판단
 * 2. 초성 매칭 — 키워드가 초성만으로 구성된 경우 (예: "ㄱㅊ") `includesByCho` 로 초성 비교
 *
 * 자음군 (ㄶ, ㄻ 등) 을 끝에 입력한 경우 구성 자음으로 풀어서 검색 (예: "ㄶ" → "ㄴㅎ").
 *
 * 키워드는 기본 {@link DEFAULT_DEBOUNCE_MS}ms debounce 적용 — input v-model 은 즉시 반영,
 * filter / 리렌더만 지연. {@code options.debounceMs: 0} 으로 끌 수 있음.
 *
 * @param items         원본 리스트 (ref / getter / raw 배열)
 * @param keyword       검색어 (ref / getter / raw — 읽기 전용)
 * @param getSearchKey  item → 검색 대상 문자열
 * @param options       debounceMs 등 옵션
 */
export function useSearchFilter<T>(
  items: MaybeRefOrGetter<readonly T[]>,
  keyword: MaybeRefOrGetter<string>,
  getSearchKey: (item: T) => string,
  options?: { debounceMs?: number },
) {
  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS
  const cRawKeyword = computed(() => toValue(keyword))
  const debouncedKeyword = debounceMs > 0 ? refDebounced(cRawKeyword, debounceMs) : cRawKeyword

  const cFiltered = computed(() => {
    const list = toValue(items)
    const kw = normalizeKeyword(debouncedKeyword.value.trim())
    if (!kw) return list

    const isChoseongOnly = /^[ㄱ-ㅎ]+$/.test(kw)

    return list.filter((item) => {
      const target = getSearchKey(item)
      if (hangulIncludes(target, kw)) return true
      if (isChoseongOnly && includesByCho(kw, target)) return true
      return false
    })
  })

  return { cFiltered }
}

/**
 * 자음군 (ㄶ, ㄻ, ㄼ 등) 을 구성 자음으로 풀어줌.
 * 예: "ㄶ" → "ㄴㅎ",  "김ㄶ" → "김ㄴㅎ"
 */
function normalizeKeyword(kw: string): string {
  if (!kw) return kw
  const last = kw.slice(-1)
  if (!isCho(last) && isJong(last)) {
    return kw.slice(0, -1) + divideByJong(last)
  }
  return kw
}
