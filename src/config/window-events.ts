/** 主窗 modal 蒙层（Rust emit_to main） */
export const MODAL_OPENED_EVENT = 'modal/opened'
export const MODAL_CLOSED_EVENT = 'modal/closed'

/** Rust 会话变更广播（跨 Webview IPC，各窗监听后写入本地 Redux） */
export const SESSION_CHANGED_EVENT = 'session/changed'

export type ModalLifecyclePayload = {
  label: string
}
