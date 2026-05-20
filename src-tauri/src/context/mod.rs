//! 跨 Webview 共享应用态：由 Tauri `.manage` 持有，经 command 读取、`events` 广播。
//!
//! 无平台 I/O 的业务细节仍在 `utils/`（如 `utils::tools::gather_install_state`）。

pub mod session;
pub mod tools_download;
