//! 启动器工具：安装态、可执行路径解析（清单 + 平台实现），供 `cmd::tools` 调用。

use serde::{Deserialize, Serialize};

use crate::config::tools_manifest::tools_manifest;
use crate::utils::platform::download::is_tool_download_installed;
use crate::utils::platform::tool_launch;

/// 各工具是否已安装 + 可启动主程序绝对路径。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolInstallState {
    pub tool_id: String,
    pub installed: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub executable_path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub install_check_error: Option<String>,
}

pub fn gather_install_state() -> Result<Vec<ToolInstallState>, String> {
    let mut out = Vec::with_capacity(tools_manifest().len());
    for tool in tools_manifest() {
        match is_tool_download_installed(&tool.download_spec, &tool.id) {
            Ok(installed) => {
                let executable_path = tool_launch::resolve_tool_launch_path(tool)
                    .ok()
                    .and_then(|p| p.to_str().map(String::from));
                out.push(ToolInstallState {
                    tool_id: tool.id.clone(),
                    installed,
                    executable_path,
                    install_check_error: None,
                });
            }
            Err(e) => {
                out.push(ToolInstallState {
                    tool_id: tool.id.clone(),
                    installed: false,
                    executable_path: None,
                    install_check_error: Some(e),
                });
            }
        }
    }
    Ok(out)
}

/// 按清单 `id` 解析已安装主程序绝对路径（Windows：注册表 `InstallPath` + 相对名；macOS：bundle）。
pub fn executable_path_str_by_tool_id(tool_id: &str) -> Result<String, String> {
    let entry = tools_manifest()
        .iter()
        .find(|t| t.id == tool_id)
        .ok_or_else(|| format!("unknown tool id: {tool_id}"))?;
    tool_launch::resolve_tool_launch_path(entry)?
        .to_str()
        .map(String::from)
        .ok_or_else(|| "launch path is not valid utf-8".to_string())
}
