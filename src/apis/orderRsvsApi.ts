import { addMinutes, subMinutes } from 'date-fns'

import type {
  OrderRsv,
  OrderRsvExt,
  OrderRsvMenu,
  OrderRsvMenuExt,
  RsvStatus,
} from '@/types/orderRsv'

// ============================================================================
// 시그니처
// ============================================================================

/** 예약 목록 조회 파라미터. */
export interface RsvsListParams {
  /** 조회 상태들. 미지정 시 전체. */
  statuses?: RsvStatus[]
  /** 당일 / 모두. 메인 페이지 세그먼트 필터. */
  dayMode?: 'TODAY' | 'ALL'
  /** 매장 필터. */
  storeSeq?: number
}

/**
 * 예약 생성 페이로드.
 * t_order_rsv(storeSeq/rsvAt/amount/cmt) + t_order_rsv_menu[] 일괄 전달.
 * status/regAt/modAt 는 백엔드 default 사용.
 */
export interface RsvCreatePayload {
  storeSeq: number
  /** 예약 일시 (ISO). */
  rsvAt: string
  cmt?: string
  /** 예약 메뉴 — rsvSeq 는 생성 후 부여되므로 제외. */
  menus: Pick<OrderRsvMenu, 'menuSeq' | 'price' | 'cnt'>[]
}

/** 예약 전체 수정 페이로드 — PUT 전체 교체. */
export type RsvUpdatePayload = RsvCreatePayload

/**
 * PATCH /order-rsvs/{seq}/status 응답 — 변경된 필드만.
 * 클라이언트는 캐시 부분 patch 또는 invalidate 트리거용.
 */
export type RsvStatusChangeResult = Pick<OrderRsv, 'seq' | 'status' | 'modAt'>

// ============================================================================
// API 함수 (mock 구현 — 백엔드 완성 시 axios 호출로 일괄 교체)
// ============================================================================

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 예약 목록 조회 (매장/템플릿/메뉴 join aggregate). */
export async function fetchList(params?: RsvsListParams): Promise<OrderRsvExt[]> {
  await delay(200)
  let result = [...MOCK_RSVS]

  if (params?.statuses?.length) {
    const set = new Set(params.statuses)
    result = result.filter((r) => set.has(r.status))
  }
  if (params?.storeSeq != null) {
    result = result.filter((r) => r.storeSeq === params.storeSeq)
  }
  if (params?.dayMode === 'TODAY') {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    result = result.filter((r) => {
      const at = new Date(r.rsvAt).getTime()
      return at >= start.getTime() && at < end.getTime()
    })
  }

  return result
}

/** 예약 상태 전이. RESERVED → COMPLETED 시 백엔드가 t_order 도 함께 INSERT. */
export async function updateStatus(seq: number, status: RsvStatus): Promise<RsvStatusChangeResult> {
  await delay(150)
  const rsv = MOCK_RSVS.find((r) => r.seq === seq)
  if (!rsv) throw new Error(`Reservation ${seq} not found`)
  rsv.status = status
  rsv.modAt = new Date().toISOString()
  return { seq: rsv.seq, status: rsv.status, modAt: rsv.modAt }
}

/** 예약 생성 (일회성). 응답으로 join 된 aggregate 반환. */
export async function create(payload: RsvCreatePayload): Promise<OrderRsvExt> {
  await delay(200)
  const seq = nextRsvSeq++
  const now = new Date().toISOString()
  const amount = payload.menus.reduce((s, m) => s + m.price * m.cnt, 0)
  const rsv: OrderRsvExt = {
    seq,
    storeSeq: payload.storeSeq,
    rsvTmplSeq: null,
    amount,
    rsvAt: payload.rsvAt,
    status: 'RESERVED',
    cmt: payload.cmt ?? null,
    regAt: now,
    modAt: now,
    storeNm: MOCK_STORE_NMS[payload.storeSeq] ?? `매장${payload.storeSeq}`,
    storeCmt: null,
    tmplNm: null,
    menus: payload.menus.map((m) => extMenu(seq, m)),
  }
  MOCK_RSVS.push(rsv)
  return rsv
}

/** 예약 전체 수정 (PUT 교체). 응답으로 갱신된 aggregate 반환. */
export async function update(seq: number, payload: RsvUpdatePayload): Promise<OrderRsvExt> {
  await delay(200)
  const idx = MOCK_RSVS.findIndex((r) => r.seq === seq)
  if (idx < 0) throw new Error(`Reservation ${seq} not found`)
  const prev = MOCK_RSVS[idx]!
  const amount = payload.menus.reduce((s, m) => s + m.price * m.cnt, 0)
  const next: OrderRsvExt = {
    ...prev,
    storeSeq: payload.storeSeq,
    rsvAt: payload.rsvAt,
    cmt: payload.cmt ?? null,
    amount,
    modAt: new Date().toISOString(),
    storeNm: MOCK_STORE_NMS[payload.storeSeq] ?? prev.storeNm,
    menus: payload.menus.map((m) => extMenu(seq, m)),
  }
  MOCK_RSVS[idx] = next
  return next
}

/** 예약 삭제. */
export async function remove(seq: number): Promise<void> {
  await delay(150)
  const idx = MOCK_RSVS.findIndex((r) => r.seq === seq)
  if (idx >= 0) MOCK_RSVS.splice(idx, 1)
}

// ============================================================================
// Mock 데이터 (단계 1 의 임시 데이터 — 단계 4 에서 storesQuery/menusQuery 와
// join 정합 보강 예정)
// ============================================================================

/** storeSeq → 매장명 (피그마 디자인 매장명 차용). */
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

/** menuSeq → (메뉴명, 가격). */
const MOCK_MENUS: Record<number, { nm: string; price: number }> = {
  1: { nm: '돈까스', price: 8000 },
  2: { nm: '제육', price: 8000 },
  3: { nm: '김치찌개', price: 7000 },
  4: { nm: '된장찌개', price: 7000 },
  5: { nm: '갈비탕', price: 10000 },
  6: { nm: '계란말이', price: 5000 },
  7: { nm: '공깃밥', price: 1000 },
}

let nextRsvSeq = 1000

function extMenu(
  rsvSeq: number,
  m: Pick<OrderRsvMenu, 'menuSeq' | 'price' | 'cnt'>,
): OrderRsvMenuExt {
  return {
    menuSeq: m.menuSeq,
    rsvSeq,
    price: m.price,
    cnt: m.cnt,
    menuNm: MOCK_MENUS[m.menuSeq]?.nm ?? `메뉴${m.menuSeq}`,
  }
}

function mkRsv(
  seq: number,
  storeSeq: number,
  tmplNm: string | null,
  rsvAt: Date,
  menus: { menuSeq: number; cnt: number }[],
  status: RsvStatus,
  modAtOffset = 0,
): OrderRsvExt {
  const menuExts = menus.map<OrderRsvMenuExt>((m) => ({
    menuSeq: m.menuSeq,
    rsvSeq: seq,
    price: MOCK_MENUS[m.menuSeq]!.price,
    cnt: m.cnt,
    menuNm: MOCK_MENUS[m.menuSeq]!.nm,
  }))
  const amount = menuExts.reduce((s, m) => s + m.price * m.cnt, 0)
  const at = rsvAt.toISOString()
  const modAt = modAtOffset === 0 ? at : addMinutes(rsvAt, modAtOffset).toISOString()
  return {
    seq,
    storeSeq,
    rsvTmplSeq: tmplNm ? 1 : null,
    amount,
    rsvAt: at,
    status,
    cmt: null,
    regAt: at,
    modAt,
    storeNm: MOCK_STORE_NMS[storeSeq]!,
    tmplNm,
    menus: menuExts,
  }
}

/** 진행 중 5건 (남은 시간 다양: 10분/18분/28분/45분/90분), 처리 이력 3건 (10분/30분/70분 전). */
const MOCK_RSVS: OrderRsvExt[] = (() => {
  const now = new Date()
  return [
    // RESERVED — danger (20분↓)
    mkRsv(
      101,
      1,
      '세림정식',
      addMinutes(now, 10),
      [
        { menuSeq: 1, cnt: 2 },
        { menuSeq: 2, cnt: 1 },
      ],
      'RESERVED',
    ),
    // RESERVED — warning (30분↓)
    mkRsv(
      102,
      2,
      '원예점심',
      addMinutes(now, 28),
      [
        { menuSeq: 3, cnt: 3 },
        { menuSeq: 7, cnt: 3 },
      ],
      'RESERVED',
    ),
    // RESERVED — fresh
    mkRsv(
      103,
      3,
      '해창오후',
      addMinutes(now, 58),
      [
        { menuSeq: 5, cnt: 2 },
        { menuSeq: 6, cnt: 1 },
      ],
      'RESERVED',
    ),
    // RESERVED — fresh, 일회성
    mkRsv(104, 4, null, addMinutes(now, 310), [{ menuSeq: 4, cnt: 4 }], 'RESERVED'),
    // RESERVED — danger (15분↓)
    mkRsv(105, 5, '보승아침', addMinutes(now, 15), [{ menuSeq: 5, cnt: 3 }], 'RESERVED'),

    // 처리 이력 — 10분 전 COMPLETED (1시간 이내 → 복구 가능)
    mkRsv(
      201,
      1,
      '세림정식',
      subMinutes(now, 40),
      [
        { menuSeq: 1, cnt: 2 },
        { menuSeq: 2, cnt: 1 },
      ],
      'COMPLETED',
      30,
    ),
    // 처리 이력 — 30분 전 CANCELED (1시간 이내 → 복구 가능)
    mkRsv(202, 2, '원예점심', subMinutes(now, 50), [{ menuSeq: 3, cnt: 2 }], 'CANCELED', 20),
    // 처리 이력 — 70분 전 COMPLETED (1시간 초과 → 복구 불가)
    mkRsv(203, 5, '보승아침', subMinutes(now, 130), [{ menuSeq: 5, cnt: 3 }], 'COMPLETED', 60),
  ]
})()
