//! 打开已安装工具：由调用方传入注册表键与相对主程序名（Windows）或 bundle 路径（macOS），
//! 不在此模块内查询嵌入的 `tools_manifest`。
//!
//! 具体解析在 [`super::windows::open_tool`] / [`super::macos::open_tool`]。

use std::path::PathBuf;

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use typeshare::typeshare;

#[typeshare]
#[derive(Debug, Clone, Deserialize, Serialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct OpenToolExecutableArgs {
    /// Windows：HKLM 下子路径，如 `SOFTWARE\Gbyte\Repair`（用于读取 `InstallPath`）。
    #[cfg_attr(target_os = "macos", allow(dead_code))]
    pub windows_hklm_software_path: Option<String>,
    /// Windows zip 安装流程中的主程序相对路径。
    #[cfg_attr(target_os = "macos", allow(dead_code))]
    pub windows_zip_main_executable_relative: Option<String>,
    /// Windows：相对 `InstallPath` 的主程序文件名。
    #[cfg_attr(target_os = "macos", allow(dead_code))]
    pub windows_main_executable_relative: Option<String>,
    #[cfg_attr(target_os = "windows", allow(dead_code))]
    pub macos_installed_bundle_path: Option<String>,
}

/// 解析待打开的可执行文件或 bundle 的绝对路径。
pub fn resolve_executable_path(args: &OpenToolExecutableArgs) -> Result<PathBuf, String> {
    #[cfg(target_os = "windows")]
    {
        return super::windows::open_tool::resolve_executable_path(args);
    }
    #[cfg(target_os = "macos")]
    {
        return super::macos::open_tool::resolve_executable_path(args);
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Err("unsupported host platform".to_string())
    }
}
