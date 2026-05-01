/** 결제 수단 (pay_type). */
export type PayType = 'CASH' | 'CARD'

/** 결제 (t_payment). */
export interface Payment {
  seq: number
  orderSeq: number
  amount: number
  payType: PayType
  payAt: string
}
