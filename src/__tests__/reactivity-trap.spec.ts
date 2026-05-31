import { describe, expect, test } from 'vitest'
import { reactive, shallowReactive, effect } from 'vue'

describe('reactive read = track 검증', () => {
  // ① "읽기만" 해도 트랩+track 되는지 증명
  test('중첩 속성을 읽기만 해도 추적된다', () => {
    const deep = reactive({ a: { n: 1 } })
    let runs = 0
    effect(() => {
      runs++
      void deep.a.n // ← 읽기만 (중첩)
    })
    console.log('초기 runs:', runs) // 1

    deep.a.n = 2 // 중첩 속성 변경
    console.log('deep 변경 후 runs:', runs) // 2  ← 읽을 때 track 됐다는 증거

    // shallow 는 중첩을 안 감싸므로 추적 안 됨
    const shallow = shallowReactive({ a: { n: 1 } })
    let r2 = 0
    effect(() => {
      r2++
      void shallow.a.n
    })
    shallow.a.n = 2
    console.log('shallow 중첩 변경 후 runs:', r2) // 1  ← 재실행 안 함 = track 안 됨
    expect(runs).toBe(2)
  })

  // ② 변경 0건, "읽기만" 할 때 deep vs raw 비용 차이
  // 출력 결과
  // * deep reactive 읽기: 113.4ms (sum=3749250000)
  // * shallow reactive 객체  읽기   : 11.4ms (sum=3749250000)
  test('읽기 전용 비용: deep vs raw', () => {
    const N = 5000
    const base = Array.from({ length: N }, (_, i) => ({
      orderSeq: i,
      payments: [{ amount: 1, vat: 0 }],
    }))
    const deepArr = reactive(base.map((o) => ({ ...o })))
    const shallowArr = shallowReactive(base.map((o) => ({ ...o })))

    const read = (arr: { orderSeq: number }[], label: string) => {
      const t = performance.now()
      let s = 0
      for (let k = 0; k < 300; k++) for (const r of arr) s += r.orderSeq // 읽기만, 변경 없음
      console.log(label, (performance.now() - t).toFixed(1) + 'ms', '(sum=' + s + ')')
    }

    read(deepArr, 'deep reactive 읽기:')
    read(shallowArr, 'shallow reactive 객체  읽기   :')

    expect(N).toBe(5000)
  })
})
