//! 按平台解析工具主程序路径；实现分别在 [`super::windows::tool_launch`] / [`super::macos::tool_launch`]。

use std::path::PathBuf;

use crate::config::tools_manifest::ToolManifestEntry;

#[cfg(target_os = "windows")]
pub fn resolve_tool_launch_path(entry: &ToolManifestEntry) -> Result<PathBuf, String> {
    super::windows::tool_launch::resolve_tool_launch_path(entry)
}

#[cfg(target_os = "macos")]
pub fn resolve_tool_launch_path(entry: &ToolManifestEntry) -> Result<PathBuf, String> {
    super::macos::tool_launch::resolve_tool_launch_path(entry)
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub fn resolve_tool_launch_path(_entry: &ToolManifestEntry) -> Result<PathBuf, String> {
    Err("unsupported platform".to_string())
}
