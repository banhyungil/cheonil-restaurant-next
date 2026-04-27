import { startOfDay } from 'date-fns'

import type {
  DayType,
  OrderRsvTmplExt,
  OrderRsvTmplMenu,
  OrderRsvTmplMenuExt,
} from '@/types/orderRsv'

// ============================================================================
// 시그니처
// ============================================================================

/** 템플릿 목록 조회 파라미터. */
export interface RsvTmplsListParams {
  storeSeq?: number
  dayType?: DayType
  active?: boolean
}

/**
 * 템플릿 생성/수정 페이로드.
 * m_order_rsv_tmpl + m_order_rsv_menu[] 일괄 전달.
 */
export interface RsvTmplCreatePayload {
  storeSeq: number
  nm: string
  /** 'HH:mm:ss'. */
  rsvTime: string
  dayTypes: DayType[]
  /** 'YYYY-MM-DD'. 필수 — 미입력 시 백엔드 default = today 가 적용되긴 하지만 클라이언트가 명시. */
  startDt: string
  /** 'YYYY-MM-DD'. null = 무기한. */
  endDt?: string | null
  cmt?: string
  active: boolean
  menus: Pick<OrderRsvTmplMenu, 'menuSeq' | 'price' | 'cnt'>[]
}

export type RsvTmplUpdatePayload = RsvTmplCreatePayload

/** 템플릿 페이지 통계 (목록에서 derive 가능 — 별도 endpoint 두지 않아도 됨). */
export interface RsvTmplStats {
  total: number
  active: number
  inactive: number
  /** 오늘 자동 생성된 인스턴스 수. 백엔드에서 별도 집계 필요. */
  generatedToday: number
}

// ============================================================================
// API 함수 (mock 구현 — 백엔드 완성 시 axios 호출로 일괄 교체)
// ============================================================================

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 템플릿 목록 조회 (매장/메뉴 join aggregate). */
export async function fetchList(params?: RsvTmplsListParams): Promise<OrderRsvTmplExt[]> {
  await delay(200)
  let result = [...MOCK_TMPLS]

  if (params?.storeSeq != null) {
    result = result.filter((t) => t.storeSeq === params.storeSeq)
  }
  if (params?.dayType) {
    result = result.filter((t) => t.dayTypes.includes(params.dayType!))
  }
  if (params?.active != null) {
    result = result.filter((t) => t.active === params.active)
  }

  return result
}

/** 템플릿 단건 조회 (편집 페이지 hydrate 용 — 목록 데이터로 충분하면 호출 불필요). */
export async function fetchById(seq: number): Promise<OrderRsvTmplExt> {
  await delay(150)
  const tmpl = MOCK_TMPLS.find((t) => t.seq === seq)
  if (!tmpl) throw new Error(`Template ${seq} not found`)
  return tmpl
}

/** 템플릿 생성. */
export async function create(payload: RsvTmplCreatePayload): Promise<OrderRsvTmplExt> {
  await delay(200)
  const seq = nextTmplSeq++
  const now = new Date().toISOString()
  const amount = payload.menus.reduce((s, m) => s + m.price * m.cnt, 0)
  const tmpl: OrderRsvTmplExt = {
    seq,
    storeSeq: payload.storeSeq,
    nm: payload.nm,
    amount,
    rsvTime: payload.rsvTime,
    dayTypes: payload.dayTypes,
    cmt: payload.cmt ?? null,
    active: payload.active,
    startDt: payload.startDt,
    endDt: payload.endDt ?? null,
    regAt: now,
    modAt: now,
    storeNm: MOCK_STORE_NMS[payload.storeSeq] ?? `매장${payload.storeSeq}`,
    menus: payload.menus.map((m) => extTmplMenu(seq, m)),
  }
  MOCK_TMPLS.push(tmpl)
  return tmpl
}

/** 템플릿 전체 수정 (PUT 교체). */
export async function update(seq: number, payload: RsvTmplUpdatePayload): Promise<OrderRsvTmplExt> {
  await delay(200)
  const idx = MOCK_TMPLS.findIndex((t) => t.seq === seq)
  if (idx < 0) throw new Error(`Template ${seq} not found`)
  const prev = MOCK_TMPLS[idx]!
  const amount = payload.menus.reduce((s, m) => s + m.price * m.cnt, 0)
  const next: OrderRsvTmplExt = {
    ...prev,
    storeSeq: payload.storeSeq,
    nm: payload.nm,
    rsvTime: payload.rsvTime,
    dayTypes: payload.dayTypes,
    cmt: payload.cmt ?? null,
    active: payload.active,
    startDt: payload.startDt,
    endDt: payload.endDt ?? null,
    amount,
    modAt: new Date().toISOString(),
    storeNm: MOCK_STORE_NMS[payload.storeSeq] ?? prev.storeNm,
    menus: payload.menus.map((m) => extTmplMenu(seq, m)),
  }
  MOCK_TMPLS[idx] = next
  return next
}

/** 템플릿 활성 토글 — 목록 행의 토글에서 사용. */
export async function patchActive(seq: number, active: boolean): Promise<void> {
  await delay(120)
  const tmpl = MOCK_TMPLS.find((t) => t.seq === seq)
  if (!tmpl) throw new Error(`Template ${seq} not found`)
  tmpl.active = active
  tmpl.modAt = new Date().toISOString()
}

/** 템플릿 삭제. 연결된 인스턴스는 백엔드가 rsv_tmpl_seq=NULL 처리. */
export async function remove(seq: number): Promise<void> {
  await delay(150)
  const idx = MOCK_TMPLS.findIndex((t) => t.seq === seq)
  if (idx >= 0) MOCK_TMPLS.splice(idx, 1)
}

// ============================================================================
// Mock 데이터
// ============================================================================

const MOCK_STORE_NMS: Record<number, string> = {
  1: '세림',
  2: '원예1층',
  3: 'A동해창',
  4: '샘표',
  5: '보승',
  6: '원예30',
  7: '909',
  8: '원예51',
  9: '유슝',
}

const MOCK_MENUS: Record<number, { nm: string; price: number }> = {
  1: { nm: '돈까스', price: 8000 },
  2: { nm: '제육', price: 8000 },
  3: { nm: '김치찌개', price: 7000 },
  4: { nm: '된장찌개', price: 7000 },
  5: { nm: '갈비탕', price: 10000 },
  6: { nm: '계란말이', price: 5000 },
  7: { nm: '공깃밥', price: 1000 },
  8: { nm: '비빔밥', price: 8000 },
  9: { nm: '냉면', price: 8000 },
}

let nextTmplSeq = 100

function extTmplMenu(
  rsvTmplSeq: number,
  m: Pick<OrderRsvTmplMenu, 'menuSeq' | 'price' | 'cnt'>,
): OrderRsvTmplMenuExt {
  return {
    menuSeq: m.menuSeq,
    rsvTmplSeq,
    price: m.price,
    cnt: m.cnt,
    menuNm: MOCK_MENUS[m.menuSeq]?.nm ?? `메뉴${m.menuSeq}`,
  }
}

const ALL_WEEKDAYS: DayType[] = ['MON', 'TUE', 'WED', 'THU', 'FRI']

function mkTmpl(
  seq: number,
  storeSeq: number,
  nm: string,
  rsvTime: string,
  dayTypes: DayType[],
  menus: { menuSeq: number; cnt: number }[],
  active: boolean,
  startDt: string,
  endDt: string | null = null,
): OrderRsvTmplExt {
  const menuExts = menus.map<OrderRsvTmplMenuExt>((m) => ({
    menuSeq: m.menuSeq,
    rsvTmplSeq: seq,
    price: MOCK_MENUS[m.menuSeq]!.price,
    cnt: m.cnt,
    menuNm: MOCK_MENUS[m.menuSeq]!.nm,
  }))
  const amount = menuExts.reduce((s, m) => s + m.price * m.cnt, 0)
  const now = startOfDay(new Date()).toISOString()
  return {
    seq,
    storeSeq,
    nm,
    amount,
    rsvTime,
    dayTypes,
    cmt: null,
    active,
    startDt,
    endDt,
    regAt: now,
    modAt: now,
    storeNm: MOCK_STORE_NMS[storeSeq]!,
    menus: menuExts,
  }
}

const MOCK_TMPLS: OrderRsvTmplExt[] = [
  mkTmpl(
    1,
    1,
    '세림정식',
    '12:30:00',
    ALL_WEEKDAYS,
    [
      { menuSeq: 1, cnt: 2 },
      { menuSeq: 2, cnt: 1 },
    ],
    true,
    '2026-01-01',
  ),
  mkTmpl(
    2,
    2,
    '원예점심',
    '12:45:00',
    ALL_WEEKDAYS,
    [
      { menuSeq: 3, cnt: 3 },
      { menuSeq: 7, cnt: 3 },
    ],
    true,
    '2026-01-01',
  ),
  mkTmpl(
    3,
    3,
    '해창오후',
    '13:15:00',
    ALL_WEEKDAYS,
    [
      { menuSeq: 5, cnt: 2 },
      { menuSeq: 6, cnt: 1 },
    ],
    true,
    '2026-02-14',
  ),
  mkTmpl(4, 5, '보승아침', '08:30:00', ALL_WEEKDAYS, [{ menuSeq: 5, cnt: 3 }], true, '2025-11-01'),
  mkTmpl(
    5,
    7,
    '909월요',
    '11:00:00',
    ['MON'],
    [{ menuSeq: 9, cnt: 2 }],
    true,
    '2026-03-01',
    '2026-06-30',
  ),
  mkTmpl(
    6,
    8,
    '원예51단골',
    '12:00:00',
    ALL_WEEKDAYS,
    [
      { menuSeq: 1, cnt: 1 },
      { menuSeq: 8, cnt: 2 },
    ],
    true,
    '2026-01-10',
  ),
  mkTmpl(
    7,
    1,
    '세림야식',
    '19:30:00',
    ['MON', 'WED', 'FRI'],
    [{ menuSeq: 1, cnt: 4 }],
    false,
    '2025-12-01',
  ),
  mkTmpl(
    8,
    9,
    '유슝정식',
    '12:00:00',
    ALL_WEEKDAYS,
    [
      { menuSeq: 4, cnt: 2 },
      { menuSeq: 7, cnt: 2 },
    ],
    true,
    '2026-04-01',
  ),
]
