use tauri::AppHandle;
use tauri::ipc::Channel;

use crate::utils::download;
use crate::utils::platform::download::{post_process_download_payload_if_needed, PlatformDownloadSpec};

use crate::config::tools_manifest::{tools_manifest, ToolManifestEntry};

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

    post_process_download_payload_if_needed(result.artifact.kind, &result.save_path).await?;
    Ok(result.save_path)
}

#[tauri::command]
pub fn get_tools_manifest() -> Result<Vec<ToolManifestEntry>, String> {
    Ok(tools_manifest().to_vec())
}
