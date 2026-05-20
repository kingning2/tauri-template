'use client'

import { Suspense } from 'react'

import { ModalPanelHost } from '@/components/modal/modal-panel-host'

export default function ModalWindowPage() {
  return (
    <Suspense fallback={null}>
      <ModalPanelHost />
    </Suspense>
  )
}
