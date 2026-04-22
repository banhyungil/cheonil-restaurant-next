import { divideByJong, hangulIncludes, includesByCho, isCho, isJong } from 'hangul-util'
import { computed, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

/**
 * 리스트 키워드 필터링 (한글 자모/초성 검색 지원).
 *
 * 매칭 규칙:
 * 1. 일반 매칭 — `hangulIncludes` 가 한글 자모 단위까지 포함 여부 판단
 * 2. 초성 매칭 — 키워드가 초성만으로 구성된 경우 (예: "ㄱㅊ") `includesByCho` 로 초성 비교
 *
 * 자음군 (ㄶ, ㄻ 등) 을 끝에 입력한 경우 구성 자음으로 풀어서 검색 (예: "ㄶ" → "ㄴㅎ").
 *
 * @param items         원본 리스트 (ref / getter / raw 배열)
 * @param keyword       검색어 ref
 * @param getSearchKey  item → 검색 대상 문자열
 */
export function useSearchFilter<T>(
  items: MaybeRefOrGetter<readonly T[]>,
  keyword: Ref<string>,
  getSearchKey: (item: T) => string,
) {
  const cFiltered = computed(() => {
    const list = toValue(items)
    const kw = normalizeKeyword(keyword.value.trim())
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
