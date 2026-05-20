/** Modal 子窗口：自上而下进入、向上退出 */
export const MODAL_ENTER_FROM = {
  y: -36,
  opacity: 0,
  duration: 0.34,
  ease: 'power2.out'
} as const

export const MODAL_EXIT_TO = {
  y: -36,
  opacity: 0,
  duration: 0.26,
  ease: 'power2.in'
} as const

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
