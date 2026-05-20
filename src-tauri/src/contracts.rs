//! 前后端 IPC 契约类型（`typeshare` → TypeScript，`schemars` → JSON Schema）。
//!
//! 实现分布在各模块；本模块 re-export 便于检索、导出 schema 与 typeshare 扫描。

#[allow(unused_imports)]
pub use crate::config::tools_manifest::ToolManifestEntry;
pub use crate::context::tools_download::{DownloadPhase, ToolDownloadEntry, ToolsDownloadSnapshot};
pub use crate::events::payloads::AppSession;
pub use crate::utils::download::ToolDownloadProgress;
pub use crate::utils::platform::download::{
    DownloadArtifact, DownloadPayloadKind, HostDesktopPlatform, PlatformArtifacts,
    PlatformDownloadSpec, ToolVariant, WindowsProductRegistry, WindowsZipInstallSteps,
};
pub use crate::utils::platform::open_tool::OpenToolExecutableArgs;
pub use crate::utils::tools::ToolInstallState;
