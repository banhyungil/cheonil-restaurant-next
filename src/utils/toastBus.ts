import type { useToast } from 'primevue/usetoast'

/**
 * PrimeVue useToast() 인스턴스 글로벌 접근 — axios 인터셉터처럼
 * setup() 외부에서 토스트 호출이 필요한 위치에서 사용.
 *
 * App.vue 등 setup 안에서 1회 setToastInstance 호출.
 */
type ToastInstance = ReturnType<typeof useToast>

let instance: ToastInstance | null = null

export function setToastInstance(t: ToastInstance) {
  instance = t
}

export function getToast(): ToastInstance | null {
  return instance
}
