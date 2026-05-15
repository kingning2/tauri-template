use std::path::PathBuf;

use futures_util::StreamExt;
use reqwest::Client;
use tauri::ipc::Channel;
use tauri::AppHandle;
use tokio::fs::{self, File};
use tokio::io::AsyncWriteExt;

fn ensure_safe_relative(rel: &str) -> Result<PathBuf, String> {
    crate::log_debug!("download.ensure_safe_relative input={}", rel);
    if rel.is_empty() || rel.contains("..") {
        crate::log_warn!("download.reject_relative_path path={}", rel);
        return Err("invalid relative path".into());
    }
    let p = PathBuf::from(rel);
    if p.components().any(|c| matches!(c, std::path::Component::ParentDir)) {
        return Err("invalid relative path".into());
    }
    Ok(p)
}

pub fn tools_download_base_dir() -> Result<PathBuf, String> {
    let dirs = directories::ProjectDirs::from("com", "polymerization", "gybte")
        .ok_or_else(|| "could not resolve app data directory".to_string())?;
    Ok(dirs.data_local_dir().join("tool-downloads"))
}

/// Stream download to `{app_data}/tool-downloads/{relative_path}` and emit per-chunk byte counts on `on_progress`.
pub async fn download_tool_file(
    _app: &AppHandle,
    url: &str,
    relative_path: &str,
    on_progress: Channel<u64>,
) -> Result<String, String> {
    crate::log_info!(
        "download.start url={} relative_path={}",
        url,
        relative_path
    );
    let safe_rel = ensure_safe_relative(relative_path)?;
    let base = tools_download_base_dir()?;
    let dest = base.join(&safe_rel);

    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|e| e.to_string())?;
    }
    crate::log_debug!("download.target_path {}", dest.display());

    let client = Client::builder()
        .use_rustls_tls()
        .build()
        .map_err(|e| e.to_string())?;

    let response = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        crate::log_error!(
            "download.http_error status={} url={}",
            response.status(),
            url
        );
        return Err(format!("HTTP {}", response.status()));
    }

    let mut stream = response.bytes_stream();
    let mut file = File::create(&dest).await.map_err(|e| e.to_string())?;

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| e.to_string())?;
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
        on_progress
            .send(chunk.len() as u64)
            .map_err(|e| e.to_string())?;
    }

    file.flush().await.map_err(|e| e.to_string())?;
    crate::log_info!(
        "download.completed url={} save_path={}",
        url,
        dest.display()
    );

    dest.to_str()
        .map(String::from)
        .ok_or_else(|| "invalid utf-8 path".to_string())
}
