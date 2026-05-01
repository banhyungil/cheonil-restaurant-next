import { addDays, format, isToday } from 'date-fns'
import { computed, ref } from 'vue'

/**
 * 단일 날짜 네비게이션 — 정산 페이지의 `< [날짜] > [오늘]` UI 용.
 *
 * 'YYYY-MM-DD' 문자열 ref 를 노출 + prev/next/today/setDate 액션 제공.
 * 범위 모드는 없음 (정산은 단일 날짜만 — 통계는 주문내역 페이지 책임).
 *
 * @param initial  초기 날짜 ('YYYY-MM-DD'). 미지정 시 오늘.
 */
export function useDateNav(initial?: string) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const date = ref(initial ?? todayStr)

  const cIsToday = computed(() => isToday(parseDate(date.value)))

  function prev() {
    date.value = format(addDays(parseDate(date.value), -1), 'yyyy-MM-dd')
  }

  function next() {
    date.value = format(addDays(parseDate(date.value), 1), 'yyyy-MM-dd')
  }

  function today() {
    date.value = format(new Date(), 'yyyy-MM-dd')
  }

  function setDate(v: string | Date) {
    date.value = v instanceof Date ? format(v, 'yyyy-MM-dd') : v
  }

  return { date, cIsToday, prev, next, today, setDate }
}

function parseDate(s: string): Date {
  // 'YYYY-MM-DD' → 로컬 자정. new Date('2026-04-15') 은 UTC 라 KST 에서 하루 앞당겨질 수 있음.
  const [y, m, d] = s.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}
