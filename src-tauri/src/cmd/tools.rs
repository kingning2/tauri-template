use tauri::AppHandle;
use tauri::ipc::Channel;

use crate::utils::download;

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
    url: String,
    relative_path: String,
    on_progress: Channel<u64>,
) -> Result<String, String> {
    download::download_tool_file(&app, &url, &relative_path, on_progress).await
}
