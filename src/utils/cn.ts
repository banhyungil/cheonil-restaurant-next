import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwind 클래스 병합 헬퍼.
 * 충돌하는 유틸리티를 자동 dedup (뒤에 오는 값이 승리).
 *
 * @example
 * cn('border-surface-300', userClass)
 * // userClass 에 'border-surface-200' 있으면 최종 border-surface-200 만 남음
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
