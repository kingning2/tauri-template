'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'

import { ModalFrame } from '@/components/modal/modal-frame'
import { resolveModalPanel } from '@/components/modal/panels'

export function ModalPanelHost() {
  const searchParams = useSearchParams()
  const name = searchParams.get('name') ?? ''
  const { t } = useTranslation('modal_window')
  const entry = resolveModalPanel(name)

  if (!entry) {
    return (
      <ModalFrame title={t('title')}>
        <p className="text-muted-foreground text-sm">
          {t('unknown_panel', { name: name || '—' })}
        </p>
      </ModalFrame>
    )
  }

  const { Component, titleKey, chrome = 'default' } = entry

  if (chrome === 'full') {
    return <Component />
  }

  return (
    <ModalFrame title={t(titleKey)}>
      <Component />
    </ModalFrame>
  )
}
