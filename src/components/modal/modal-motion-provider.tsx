'use client'

import gsap from 'gsap'
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode
} from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

import {
  MODAL_ENTER_FROM,
  MODAL_EXIT_TO,
  prefersReducedMotion
} from '@/animation/modal/window-motion'
import { closeModalWindow } from '@/cmd/window'
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect'
import { cn } from '@/lib/utils'

type ModalMotionContextValue = {
  requestClose: () => void
}

const ModalMotionContext = createContext<ModalMotionContextValue | null>(null)

function closeModalWindowSafe() {
  const label = getCurrentWindow().label
  void closeModalWindow(label).catch(() => {
    void getCurrentWindow()
      .close()
      .catch(() => undefined)
  })
}

export function ModalMotionProvider({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)

  useIsomorphicLayoutEffect(() => {
    const el = rootRef.current
    if (!el || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.from(el, { ...MODAL_ENTER_FROM })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  const requestClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true

    const el = rootRef.current
    if (!el || prefersReducedMotion()) {
      closeModalWindowSafe()
      return
    }

    el.style.pointerEvents = 'none'
    gsap.to(el, {
      ...MODAL_EXIT_TO,
      onComplete: closeModalWindowSafe
    })
  }, [])

  return (
    <ModalMotionContext.Provider value={{ requestClose }}>
      <div
        ref={rootRef}
        className={cn(
          'modal-window flex min-h-0 flex-1 flex-col overflow-hidden will-change-transform',
          className
        )}
      >
        {children}
      </div>
    </ModalMotionContext.Provider>
  )
}

export function useModalMotion() {
  const ctx = useContext(ModalMotionContext)
  return {
    requestClose: ctx?.requestClose ?? closeModalWindowSafe
  }
}
