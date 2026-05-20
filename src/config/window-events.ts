import type { ToolInstallState, ToolsDownloadSnapshot } from "@/generated/contracts";

/** 主窗 label（与 Rust `events::names::MAIN_WINDOW_LABEL` 一致） */
export const MAIN_WINDOW_LABEL = "main";

/** 主窗 modal 蒙层（Rust emit_to main） */
export const MODAL_OPENED_EVENT = "modal/opened";
export const MODAL_CLOSED_EVENT = "modal/closed";
/** Rust → modal 子窗：切换面板（单窗复用，不新建 Webview） */
export const MODAL_OPEN_PANEL_EVENT = "modal/open-panel";

/** Rust 会话变更广播（跨 Webview IPC，各窗监听后写入本地 Redux） */
export const SESSION_CHANGED_EVENT = "session/changed";

/** Rust 工具下载态广播（各窗监听后写入本地 Redux `download` slice） */
export const TOOLS_DOWNLOAD_CHANGED_EVENT = "tools/download/changed";

/** Rust 工具安装态广播（各窗更新本地 install 映射） */
export const TOOLS_INSTALL_STATE_CHANGED_EVENT = "tools/install-state/changed";

/** 前端 → Rust（Rust `events::handlers` 中 listen） */
export const FE_LOG_EVENT = "fe/log";
export const FE_LOG_REQ_EVENT = "fe/log-req";

export type { ToolsDownloadSnapshot };

export type ToolsInstallStateChangedPayload = ToolInstallState[];

export type ModalLifecyclePayload = {
  label: string;
};

export type ModalOpenPanelPayload = {
  name: string;
  title?: string;
};

export type FeLogLevel = "info" | "error" | "warn";

export type FeLogPayload = {
  level: FeLogLevel;
  msg: string;
};
