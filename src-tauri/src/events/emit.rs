//! Rust → 前端：统一 emit / emit_to 出口。

use tauri::{AppHandle, Emitter, Manager};

use super::names::{self, MAIN_WINDOW_LABEL};
use super::payloads::{AppSession, ModalLifecyclePayload};
use crate::utils::tools::ToolInstallState;
use crate::context::tools_download::ToolsDownloadSnapshot;

fn map_emit_err(e: tauri::Error) -> String {
    e.to_string()
}

/// 向所有 Webview 广播会话快照（跨窗 IPC）。
pub fn session_changed_all(app: &AppHandle, session: &AppSession) -> Result<(), String> {
    for (label, _) in app.webview_windows() {
        session_changed_to(app, &label, session)?;
    }
    Ok(())
}

/// 向单个 Webview 推送会话（如新开的 modal 窗）。
pub fn session_changed_to(
    app: &AppHandle,
    webview_label: &str,
    session: &AppSession,
) -> Result<(), String> {
    app.emit_to(webview_label, names::SESSION_CHANGED, session)
        .map_err(map_emit_err)
}

/// 通知主窗：modal 已打开（驱动蒙层）。
pub fn modal_opened(app: &AppHandle, label: impl Into<String>) -> Result<(), String> {
    let label = label.into();
    app.emit_to(
        MAIN_WINDOW_LABEL,
        names::MODAL_OPENED,
        ModalLifecyclePayload { label },
    )
    .map_err(map_emit_err)
}

/// 向所有 Webview 广播工具下载态快照。
pub fn tools_download_changed_all(
    app: &AppHandle,
    snapshot: &ToolsDownloadSnapshot,
) -> Result<(), String> {
    for (label, _) in app.webview_windows() {
        tools_download_changed_to(app, &label, snapshot)?;
    }
    Ok(())
}

pub fn tools_download_changed_to(
    app: &AppHandle,
    webview_label: &str,
    snapshot: &ToolsDownloadSnapshot,
) -> Result<(), String> {
    app.emit_to(webview_label, names::TOOLS_DOWNLOAD_CHANGED, snapshot)
        .map_err(map_emit_err)
}

/// 向所有 Webview 广播工具安装态（下载完成后等与磁盘/registry 对齐）。
pub fn tools_install_state_changed_all(
    app: &AppHandle,
    states: &[ToolInstallState],
) -> Result<(), String> {
    for (label, _) in app.webview_windows() {
        tools_install_state_changed_to(app, &label, states)?;
    }
    Ok(())
}

pub fn tools_install_state_changed_to(
    app: &AppHandle,
    webview_label: &str,
    states: &[ToolInstallState],
) -> Result<(), String> {
    app.emit_to(webview_label, names::TOOLS_INSTALL_STATE_CHANGED, states)
        .map_err(map_emit_err)
}

/// 通知主窗：modal 已关闭。
pub fn modal_closed(app: &AppHandle, label: impl Into<String>) -> Result<(), String> {
    let label = label.into();
    app.emit_to(
        MAIN_WINDOW_LABEL,
        names::MODAL_CLOSED,
        ModalLifecyclePayload { label },
    )
    .map_err(map_emit_err)
}
