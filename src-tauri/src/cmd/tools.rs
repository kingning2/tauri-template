use tauri::AppHandle;
use tauri::ipc::Channel;
use tauri_plugin_opener::OpenerExt;

use crate::config::tools_manifest::{tools_manifest, ToolManifestEntry};
use crate::utils::download;
use crate::utils::platform::download::{post_process_download_payload_if_needed, PlatformDownloadSpec};
use crate::utils::platform::tool_launch;

#[tauri::command]
pub async fn get_tools_download_dir() -> Result<String, String> {
    download::tools_download_base_dir()?
        .to_str()
        .map(String::from)
        .ok_or_else(|| "invalid utf-8 path".to_string())
}

#[tauri::command]
pub async fn download_tool(
    app: AppHandle,
    download_spec: PlatformDownloadSpec,
    relative_dir: String,
    on_progress: Channel<u64>,
) -> Result<String, String> {
    let result =
        download::download_tool_file_by_platform(&app, &download_spec, &relative_dir, on_progress)
            .await?;

    post_process_download_payload_if_needed(result.artifact.kind, &result.save_path, &download_spec)
        .await?;
    Ok(result.save_path)
}

#[tauri::command]
pub fn get_tools_manifest() -> Result<Vec<ToolManifestEntry>, String> {
    Ok(tools_manifest().to_vec())
}

/// 当前进程所在桌面平台（供前端判断 `windows` / `macos` 下是否有 `universal` 下载项）。
#[tauri::command]
pub fn runtime_host_platform() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        return Ok("windows".to_string());
    }
    #[cfg(target_os = "macos")]
    {
        return Ok("macos".to_string());
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Err("unsupported host platform".to_string())
    }
}

/// 解析已安装主程序的绝对路径（Windows：`InstallPath` + 清单中的相对主程序名；macOS：`.app` 路径）。
#[tauri::command]
pub fn get_tool_executable_path(tool_id: String) -> Result<String, String> {
    let entry = tools_manifest()
        .iter()
        .find(|t| t.id == tool_id)
        .ok_or_else(|| format!("unknown tool id: {tool_id}"))?;
    tool_launch::resolve_tool_launch_path(entry)?
        .to_str()
        .map(String::from)
        .ok_or_else(|| "launch path is not valid utf-8".to_string())
}

/// 按工具 `id` 解析已安装主程序路径并交给系统打开（Windows：exe；macOS：`.app`）。
#[tauri::command]
pub fn open_tool_executable(app: AppHandle, tool_id: String) -> Result<(), String> {
    let path_str = get_tool_executable_path(tool_id)?;
    app.opener()
        .open_path(path_str, None::<&str>)
        .map_err(|e| e.to_string())
}
