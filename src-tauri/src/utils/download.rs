use std::path::PathBuf;
use std::time::Duration;

use futures_util::StreamExt;
use reqwest::header::{CONTENT_LENGTH, RANGE};
use reqwest::{Client, StatusCode};
use tauri::ipc::Channel;
use tauri::AppHandle;
use tokio::fs::{self, OpenOptions};
use tokio::io::AsyncSeekExt;
use tokio::io::AsyncWriteExt;
use tokio::time::sleep;

use crate::utils::platform::download::{
    resolve_download_artifact, PlatformDownloadResult, PlatformDownloadSpec,
};

/// 将下载落地路径拼成安全的相对路径：`{relative_dir}/{file_name}`。
///
/// 该函数会：
/// - 兼容空的 `relative_dir`（此时直接使用 `file_name`）
/// - 去除 `relative_dir` 两端的 `/` 和 `\`
/// - 用 [`ensure_safe_relative`] 做安全校验，防止目录穿越（`..`）或绝对路径写入。
fn build_relative_download_path(relative_dir: &str, file_name: &str) -> Result<String, String> {
    let file_name = file_name.trim();
    if file_name.is_empty() {
        return Err("file_name is required".to_string());
    }

    let dir = relative_dir.trim().trim_matches('/').trim_matches('\\');
    let rel = if dir.is_empty() {
        file_name.to_string()
    } else {
        format!("{dir}/{file_name}")
    };

    ensure_safe_relative(&rel)?;
    Ok(rel)
}

/// 根据当前系统（OS/ARCH）从 `spec` 解析出应下载的资源，并将其下载到本地。
///
/// 这是一个“平台感知”的下载入口：内部会先用 `spec` 选择正确的 URL + 文件名，
/// 再调用 [`download_tool_file_retries_range`] 进行**重试**与**断点续传**。
///
/// # 参数
/// - `app`: Tauri 的 `AppHandle`（当前只是为了与其它下载函数保持一致）
/// - `spec`: 平台下载描述，包含 `windows` / `macos`，以及 `x64` / `arm64` / `universal` 的兜底规则
/// - `relative_dir`: 资源保存时的相对目录名（最终会落到 `{app_data}/tool-downloads/{relative_dir}/...`）
/// - `on_progress`: 下载过程中用于上报进度的通道，发送的是**每个分块写入的字节数**
///
/// # 返回
/// [`PlatformDownloadResult`]
/// - `save_path`：落地文件的完整路径字符串
/// - `artifact`：本次解析出来的 URL / 文件名 / kind（zip 或可执行文件）
///
/// # 示例
/// ```rust,ignore
/// use tauri::ipc::Channel;
/// use tauri::AppHandle;
///
/// use crate::utils::download::download_tool_file_by_platform;
/// use crate::utils::platform::download::{
///   DownloadArtifact, DownloadPayloadKind, PlatformArtifacts, PlatformDownloadSpec,
/// };
///
/// // 由你在调用方拼装 spec：
/// let spec = PlatformDownloadSpec {
///   windows: Some(PlatformArtifacts {
///     x64: Some(DownloadArtifact {
///       url: "https://example.com/tools/win/x64/installer.zip".to_string(),
///       file_name: "installer.zip".to_string(),
///       kind: DownloadPayloadKind::Zip,
///     }),
///     arm64: None,
///     universal: None,
///   }),
///   macos: Some(PlatformArtifacts {
///     universal: Some(DownloadArtifact {
///       url: "https://example.com/tools/mac/installer.zip".to_string(),
///       file_name: "installer.zip".to_string(),
///       kind: DownloadPayloadKind::Zip,
///     }),
///     x64: None,
///     arm64: None,
///   }),
/// };
///
/// // on_progress 需要你在 Tauri command/业务层创建好 Channel<u64>
/// let result = download_tool_file_by_platform(
///   &app,
///   &spec,
///   "system-repair",
///   on_progress,
/// ).await?;
///
/// println!("downloaded to: {}", result.save_path);
/// ```
pub async fn download_tool_file_by_platform(
    app: &AppHandle,
    spec: &PlatformDownloadSpec,
    relative_dir: &str,
    on_progress: Channel<u64>,
) -> Result<PlatformDownloadResult, String> {
    let artifact = resolve_download_artifact(spec)?;
    let relative_path = build_relative_download_path(relative_dir, &artifact.file_name)?;
    let save_path =
        download_tool_file_retries_range(app, &artifact.url, &relative_path, on_progress).await?;

    Ok(PlatformDownloadResult {
        save_path,
        artifact,
    })
}

/// 校验相对路径是否安全，确保只能写入我们期望的下载目录下。
///
/// 拒绝的情况：
/// - 空字符串
/// - 包含 `..`（目录穿越）
/// - 绝对路径
fn ensure_safe_relative(rel: &str) -> Result<PathBuf, String> {
    crate::log_debug!("download.ensure_safe_relative input={}", rel);
    if rel.is_empty() || rel.contains("..") {
        crate::log_warn!("download.reject_relative_path path={}", rel);
        return Err("invalid relative path".into());
    }
    let p = PathBuf::from(rel);
    if p.is_absolute() {
        return Err("invalid relative path: absolute path is not allowed".into());
    }
    if p.components()
        .any(|c| matches!(c, std::path::Component::ParentDir))
    {
        return Err("invalid relative path".into());
    }
    Ok(p)
}

/// 获取工具下载的基础目录。
///
/// 所有下载文件会存放到：
/// `{app_data}/tool-downloads`
pub fn tools_download_base_dir() -> Result<PathBuf, String> {
    let dirs = directories::ProjectDirs::from("com", "polymerization", "gybte")
        .ok_or_else(|| "could not resolve app data directory".to_string())?;
    Ok(dirs.data_local_dir().join("tool-downloads"))
}

/// 带“重试 + HTTP Range 断点续传”的下载实现。
///
/// 关键行为：
/// - 如果服务端支持续传（响应 `206 PARTIAL_CONTENT`），则在已有文件后追加
/// - 否则会截断已有文件并从头开始下载
/// - `on_progress` 上报的是每个分块写入的字节数
///
/// # 参数
/// - `url`: 远端文件 URL
/// - `relative_path`: `{app_data}/tool-downloads/` 下的相对落地路径
/// - `on_progress`: 上报分块写入进度
///
/// # 返回
/// 保存完成后的落地路径字符串（期望为 UTF-8）
pub async fn download_tool_file_retries_range(
    _app: &AppHandle,
    url: &str,
    relative_path: &str,
    on_progress: Channel<u64>,
) -> Result<String, String> {
    crate::log_info!(
        "download.start(retries_range) url={} relative_path={}",
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

    const MAX_RETRIES: u8 = 3;
    const RETRY_DELAY_MS: u64 = 3000;

    let mut attempt: u8 = 0;
    loop {
        if attempt > 0 {
            sleep(Duration::from_millis(RETRY_DELAY_MS)).await;
        }
        attempt += 1;
        crate::log_debug!(
            "download.attempt {}/{} url={}",
            attempt,
            MAX_RETRIES + 1,
            url
        );

        let existing_size = fs::metadata(&dest).await.map(|m| m.len()).unwrap_or(0);

        let response = match client
            .get(url)
            .header(RANGE, format!("bytes={}-", existing_size))
            .send()
            .await
        {
            Ok(r) => r,
            Err(e) => {
                crate::log_warn!("download.http_send_err url={} err={}", url, e);
                if attempt > MAX_RETRIES {
                    return Err(format!("download failed: {}", e));
                }
                continue;
            }
        };

        let resume_supported = response.status() == StatusCode::PARTIAL_CONTENT;

        if !response.status().is_success() && !resume_supported {
            crate::log_error!(
                "download.http_error status={} url={}",
                response.status(),
                url
            );
            if attempt > MAX_RETRIES {
                return Err(format!("HTTP {}", response.status()));
            }
            continue;
        }

        // Open file depending on whether we can resume.
        let mut file = if resume_supported {
            // Append mode: file already contains the prefix bytes.
            let mut f = OpenOptions::new()
                .create(true)
                .write(true)
                .open(&dest)
                .await
                .map_err(|e| e.to_string())?;
            f.seek(std::io::SeekFrom::Start(existing_size))
                .await
                .map_err(|e| e.to_string())?;
            f
        } else {
            // Restart from scratch.
            OpenOptions::new()
                .create(true)
                .write(true)
                .truncate(true)
                .open(&dest)
                .await
                .map_err(|e| e.to_string())?
        };

        let mut downloaded: u64 = if resume_supported { existing_size } else { 0 };

        // If we resumed successfully, make UI reflect already-written bytes.
        if resume_supported && existing_size > 0 {
            on_progress.send(existing_size).map_err(|e| e.to_string())?;
        }

        // Best-effort logging: for resume responses, CONTENT_LENGTH is body length not total length.
        let _body_len: u64 = response
            .headers()
            .get(CONTENT_LENGTH)
            .and_then(|v| v.to_str().ok())
            .and_then(|s| s.parse().ok())
            .unwrap_or(0);

        let mut stream = response.bytes_stream();
        let mut is_success = true;

        while let Some(item) = stream.next().await {
            let chunk = match item {
                Ok(c) => c,
                Err(e) => {
                    crate::log_warn!("download.stream_err url={} err={}", url, e);
                    is_success = false;
                    break;
                }
            };

            file.write_all(&chunk).await.map_err(|e| e.to_string())?;
            downloaded += chunk.len() as u64;

            on_progress
                .send(chunk.len() as u64)
                .map_err(|e| e.to_string())?;
        }

        if !is_success {
            if attempt > MAX_RETRIES {
                return Err("download failed: exceeded retry limit".to_string());
            }
            continue;
        }

        // Ensure file is fully persisted.
        file.flush().await.map_err(|e| e.to_string())?;
        file.sync_all().await.map_err(|e| e.to_string())?;

        crate::log_info!(
            "download.completed(retries_range) url={} save_path={} bytes_written={}",
            url,
            dest.display(),
            downloaded
        );

        return dest
            .to_str()
            .map(String::from)
            .ok_or_else(|| "invalid utf-8 path".to_string());
    }
}
