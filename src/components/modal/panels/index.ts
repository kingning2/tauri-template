import type { ComponentType } from 'react'

import { ActivatePanel } from './activate'

export const MODAL_PANEL_REGISTRY = {
  activate: ActivatePanel
} as const satisfies Record<string, ComponentType>

export type ModalPanelName = keyof typeof MODAL_PANEL_REGISTRY

export function resolveModalPanel(name: string): ComponentType | undefined {
  if (!(name in MODAL_PANEL_REGISTRY)) return undefined
  return MODAL_PANEL_REGISTRY[name as ModalPanelName]
}
