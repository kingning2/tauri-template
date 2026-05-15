'use client'

import { useEffect } from 'react'

import { initWindowConfig } from '@/config/popup-window'

import InitGuard from '@/guards/global/init-guard'

export default function GlobalProvider({
  children
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    initWindowConfig()

    const app = document.getElementById('App')
    if (!app) return

    const ua = navigator.userAgent
    if (/Windows/i.test(ua)) {
      app.classList.add('windows')
    } else if (/Mac/i.test(ua)) {
      app.classList.add('macos')
    }
  }, [])

  return (
    <InitGuard>
      <div
        id="App"
        className="antialiased"
        onContextMenu={(e) => e.preventDefault()}
      >
        {children}
      </div>
    </InitGuard>
  )
}
