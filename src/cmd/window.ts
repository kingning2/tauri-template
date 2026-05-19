import { invokeWrapper } from '.'

export type OpenModalWindowArgs = {
  path: string
  title?: string
  width?: number
  height?: number
  label?: string
}

export const openModalWindow = (args: OpenModalWindowArgs) =>
  invokeWrapper<string>('open_modal_window', { ...args })

export const closeModalWindow = (label: string) =>
  invokeWrapper<void>('close_modal_window', { label })
