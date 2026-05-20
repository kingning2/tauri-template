/** 主窗 label（与 Rust `events::names::MAIN_WINDOW_LABEL` 一致） */
export const MAIN_WINDOW_LABEL = "main";

/** 主窗 modal 蒙层（Rust emit_to main） */
export const MODAL_OPENED_EVENT = "modal/opened";
export const MODAL_CLOSED_EVENT = "modal/closed";

/** Rust 会话变更广播（跨 Webview IPC，各窗监听后写入本地 Redux） */
export const SESSION_CHANGED_EVENT = "session/changed";

/** 前端 → Rust（Rust `events::handlers` 中 listen） */
export const FE_LOG_EVENT = "fe/log";
export const FE_LOG_REQ_EVENT = "fe/log-req";

/** 新事件建议命名：`fe/<domain>/<action>` */
export const FE_EVENT_PREFIX = "fe/";

export type ModalLifecyclePayload = {
  label: string;
};

export type FeLogLevel = "info" | "error" | "warn";

export type FeLogPayload = {
  level: FeLogLevel;
  msg: string;
};
