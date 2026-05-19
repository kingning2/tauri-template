use tauri::AppHandle;
use tauri::ipc::Channel;
use tauri_plugin_opener::OpenerExt;

use crate::config::tools_manifest::{tools_manifest, ToolManifestEntry};
use crate::utils::download::{self, ToolDownloadProgress};
use crate::utils::platform::download::{
    post_process_download_payload_if_needed, HostDesktopPlatform, PlatformDownloadSpec,
};
use crate::utils::log::{trace_result_async, trace_result_fn};
use crate::utils::platform::open_tool::{OpenToolExecutableArgs, resolve_executable_path as resolve_open_executable_path};
use crate::utils::tools::{self, ToolInstallState};

#[tauri::command]
pub async fn get_tools_download_dir() -> Result<String, String> {
    trace_result_fn("cmd.tools", "get_tools_download_dir", || {
        download::tools_download_base_dir()?
            .to_str()
            .map(String::from)
            .ok_or_else(|| "invalid utf-8 path".to_string())
    })
}

#[tauri::command]
pub async fn download_tool(
    app: AppHandle,
    download_spec: PlatformDownloadSpec,
    relative_dir: String,
    on_progress: Channel<ToolDownloadProgress>,
) -> Result<String, String> {
    trace_result_async("cmd.tools", "download_tool", async {
        let result =
            download::download_tool_file_by_platform(&app, &download_spec, &relative_dir, on_progress)
                .await?;

        post_process_download_payload_if_needed(
            result.artifact.kind,
            &result.save_path,
            &download_spec,
            &relative_dir,
        )
        .await?;
        Ok(result.save_path)
    })
    .await
}

#[tauri::command]
pub fn get_tools_manifest() -> Result<Vec<ToolManifestEntry>, String> {
    trace_result_fn("cmd.tools", "get_tools_manifest", || Ok(tools_manifest().to_vec()))
}

/// 各工具是否已安装 + 可启动主程序绝对路径（与 [`get_tool_executable_path`] 同源解析逻辑）。
#[tauri::command]
pub fn get_tools_install_state() -> Result<Vec<ToolInstallState>, String> {
    trace_result_fn("cmd.tools", "get_tools_install_state", || tools::gather_install_state())
}

/// 当前进程所在桌面平台（供前端判断 `windows` / `macos` 下是否有 `universal` 下载项）。
#[tauri::command]
pub fn runtime_host_platform() -> Result<HostDesktopPlatform, String> {
    trace_result_fn("cmd.tools", "runtime_host_platform", || {
        #[cfg(target_os = "windows")]
        {
            return Ok(HostDesktopPlatform::Windows);
        }
        #[cfg(target_os = "macos")]
        {
            return Ok(HostDesktopPlatform::Macos);
        }
        #[cfg(not(any(target_os = "windows", target_os = "macos")))]
        {
            Err("unsupported host platform".to_string())
        }
    })
}

/// 解析已安装主程序的绝对路径（Windows：注册表 `InstallPath` + 清单相对主程序名；macOS：`.app` 路径）。
#[tauri::command]
pub fn get_tool_executable_path(tool_id: String) -> Result<String, String> {
    trace_result_fn("cmd.tools", "get_tool_executable_path", || {
        tools::executable_path_str_by_tool_id(&tool_id)
    })
}

/// 按注册表 / bundle 解析已安装主程序路径并交给系统打开。
#[tauri::command]
pub fn open_tool_executable(app: AppHandle, args: OpenToolExecutableArgs) -> Result<(), String> {
    trace_result_fn("cmd.tools", "open_tool_executable", || {
        let path_str = resolve_open_executable_path(&args)?
            .to_str()
            .map(String::from)
            .ok_or_else(|| "launch path is not valid utf-8".to_string())?;
        app.opener()
            .open_path(path_str, None::<&str>)
            .map_err(|e| e.to_string())
    })
}
