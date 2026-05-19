'use client'

import { useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

import { isModalWindowLabel } from '@/config/modal-window'

export default function ModalWindowLayout({
  children
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const label = getCurrentWindow().label
    if (!isModalWindowLabel(label)) return
    document.getElementById('App')?.classList.add('modal-window-root')
  }, [])

  return (
    <div className="modal-window flex min-h-0 flex-1 flex-col overflow-hidden">
      {children}
    </div>
  )
}
