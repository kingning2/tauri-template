import type { ComponentType } from 'react'

import { ActivatePanel } from './activate'

export type ModalPanelEntry = {
  Component: ComponentType
  /** `modal_window` 命名空间下的 i18n key */
  titleKey: string
  /** `full`：面板自管标题栏与布局（如啟用窗） */
  chrome?: 'default' | 'full'
}

export const MODAL_PANEL_REGISTRY = {
  activate: {
    Component: ActivatePanel,
    titleKey: 'activate_title',
    chrome: 'full'
  }
} as const satisfies Record<string, ModalPanelEntry>

export type ModalPanelName = keyof typeof MODAL_PANEL_REGISTRY

export function resolveModalPanel(name: string): ModalPanelEntry | undefined {
  if (!(name in MODAL_PANEL_REGISTRY)) return undefined
  return MODAL_PANEL_REGISTRY[name as ModalPanelName]
}
