export type Debounced<T extends (...args: never[]) => void> = ((
  ...args: Parameters<T>
) => void) & { cancel: () => void }

/**
 * 连续触发时只在最后一次调用后 `waitMs` 毫秒执行。
 * 调用返回函数的 `.cancel()` 可取消待执行的计时。
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  waitMs: number,
): Debounced<T> {
  let id: ReturnType<typeof setTimeout> | undefined

  const wrapped = (...args: Parameters<T>) => {
    clearTimeout(id)
    id = setTimeout(() => {
      id = undefined
      fn(...args)
    }, waitMs)
  }

  wrapped.cancel = () => {
    clearTimeout(id)
    id = undefined
  }

  return wrapped as Debounced<T>
}

/**
 * 在 `waitMs` 窗口内最多执行一次；首次可立即执行，窗口内末次调用会在窗口结束时再执行一次（trailing）。
 */
export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  waitMs: number,
): (...args: Parameters<T>) => void {
  let lastRun = 0
  let trailingTimer: ReturnType<typeof setTimeout> | undefined

  return (...args: Parameters<T>) => {
    const now = Date.now()
    const elapsed = now - lastRun

    const run = () => {
      lastRun = Date.now()
      fn(...args)
    }

    if (elapsed >= waitMs) {
      if (trailingTimer !== undefined) {
        clearTimeout(trailingTimer)
        trailingTimer = undefined
      }
      run()
      return
    }

    if (trailingTimer === undefined) {
      trailingTimer = setTimeout(() => {
        trailingTimer = undefined
        run()
      }, waitMs - elapsed)
    }
  }
}
