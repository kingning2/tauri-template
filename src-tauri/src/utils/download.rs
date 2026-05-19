use std::path::PathBuf;
use std::time::{Duration, Instant};

use futures_util::StreamExt;
use reqwest::header::{CONTENT_RANGE, RANGE};
use reqwest::{Client, Response, StatusCode};
use tauri::ipc::Channel;
use tauri::AppHandle;
use tokio::fs::{self, OpenOptions};
use tokio::io::AsyncSeekExt;
use tokio::io::AsyncWriteExt;
use tokio::time::sleep;

use crate::utils::platform::download::{
    resolve_download_artifact, PlatformDownloadResult, PlatformDownloadSpec,
};

/// 工具下载进度（Rust → 前端 Channel）。
#[typeshare::typeshare]
#[derive(Clone, Debug, serde::Serialize, schemars::JsonSchema)]
pub struct ToolDownloadProgress {
    /// 已写入磁盘的累计字节数（含断点续传前已有部分）。
    pub downloaded: i32,
    /// 完整文件总字节数；若响应未提供 `Content-Length` / `Content-Range` 则为 `null`。
    pub total: Option<i32>,
}

fn parse_content_range_total(s: &str) -> Option<u64> {
    let rest = s.strip_prefix("bytes ")?.trim();
    let (_, total_part) = rest.rsplit_once('/')?;
    let total_part = total_part.trim();
    if total_part == "*" {
        return None;
    }
    total_part.parse().ok()
}

/// 从响应头推断完整文件大小（用于真实进度条）。
fn infer_total_file_bytes(existing_on_disk: u64, resume: bool, response: &Response) -> Option<u64> {
    if let Some(cr) = response.headers().get(CONTENT_RANGE) {
        if let Ok(s) = cr.to_str() {
            if let Some(t) = parse_content_range_total(s) {
                return Some(t);
            }
        }
    }
    let body_len = response.content_length()?;
    if resume && response.status() == StatusCode::PARTIAL_CONTENT {
        existing_on_disk.checked_add(body_len)
    } else {
        Some(body_len)
    }
}

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
/// - `on_progress`: 下载过程中上报进度（已下载字节 + 总大小，总大小来自 `Content-Length` / `Content-Range`）
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
/// // on_progress：Tauri command 侧创建 `Channel<ToolDownloadProgress>`
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
    on_progress: Channel<ToolDownloadProgress>,
) -> Result<PlatformDownloadResult, String> {
    let artifact = resolve_download_artifact(spec).await?;
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

/// 带「重试 + HTTP Range 断点续传」的下载实现。
///
/// **传输方式**：单连接 `GET` + `bytes_stream()` **流式写入**（按 TCP 分片到达顺序落盘），不是多连接并行分片。
///
/// **Range / 续传**：仅用于**同一次 `download_tool` 调用内**的重试（例如中途断流后 `attempt` 递增再次请求）；
/// **每次用户新发起下载的首次尝试**（`attempt == 1`）会先 **删除** 目标路径已有文件，避免上次程序中途退出留下的半截包导致一直从半截续传、进度条不清零。
///
/// 其他行为：
/// - 若服务端支持续传（响应 `206 PARTIAL_CONTENT`），则在已有文件后追加
/// - 否则截断已有文件并从头开始下载
/// - `on_progress` 上报累计已下载字节与（若可知）完整文件总大小
///
/// # 参数
/// - `url`: 远端文件 URL
/// - `relative_path`: `{app_data}/tool-downloads/` 下的相对落地路径
/// - `on_progress`: 上报下载进度事件
///
/// # 返回
/// 保存完成后的落地路径字符串（期望为 UTF-8）
pub async fn download_tool_file_retries_range(
    _app: &AppHandle,
    url: &str,
    relative_path: &str,
    on_progress: Channel<ToolDownloadProgress>,
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
    /// 流式写入过程中定期打 INFO，避免只有头尾两条日志
    const PROGRESS_LOG_MIN_INTERVAL: Duration = Duration::from_millis(1500);
    const PROGRESS_LOG_MIN_BYTES: u64 = 256 * 1024;

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

        // 新一轮用户下载：去掉上次未完成的半截文件，进度从 0 开始；同一次调用内的重试不删（attempt > 1）。
        if attempt == 1 {
            if let Ok(meta) = fs::metadata(&dest).await {
                crate::log_info!(
                    "download.discard_previous_artifact path={} previous_bytes={}",
                    dest.display(),
                    meta.len()
                );
                if let Err(e) = fs::remove_file(&dest).await {
                    crate::log_warn!(
                        "download.remove_previous_artifact_failed path={} err={}",
                        dest.display(),
                        e
                    );
                }
            }
        }

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

        crate::log_info!(
            "download.http_ready status={} resume_supported={} existing_on_disk={} content_length_header={:?} url={}",
            response.status(),
            resume_supported,
            existing_size,
            response.content_length(),
            url
        );

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

        let total_hint = infer_total_file_bytes(existing_size, resume_supported, &response);

        crate::log_info!(
            "download.body_stream_start path={} total_hint={:?} resume_supported={}",
            dest.display(),
            total_hint,
            resume_supported
        );

        // If we resumed successfully, make UI reflect already-written bytes.
        if resume_supported && existing_size > 0 {
            on_progress
                .send(ToolDownloadProgress {
                    downloaded: u32::try_from(existing_size).unwrap_or(u32::MAX) as i32,
                    total: total_hint.and_then(|t| u32::try_from(t).ok().map(|n| n as i32)),
                })
                .map_err(|e| e.to_string())?;
        }

        let mut stream = response.bytes_stream();
        let mut is_success = true;
        let mut last_progress_log = Instant::now();
        let mut bytes_since_progress_log: u64 = 0;

        while let Some(item) = stream.next().await {
            let chunk = match item {
                Ok(c) => c,
                Err(e) => {
                    crate::log_warn!("download.stream_err url={} err={}", url, e);
                    is_success = false;
                    break;
                }
            };

            let chunk_len = chunk.len() as u64;
            file.write_all(&chunk).await.map_err(|e| e.to_string())?;
            downloaded += chunk_len;
            bytes_since_progress_log += chunk_len;

            on_progress
                .send(ToolDownloadProgress {
                    downloaded: u32::try_from(downloaded).unwrap_or(u32::MAX) as i32,
                    total: total_hint.and_then(|t| u32::try_from(t).ok().map(|n| n as i32)),
                })
                .map_err(|e| e.to_string())?;

            let elapsed = last_progress_log.elapsed();
            if bytes_since_progress_log >= PROGRESS_LOG_MIN_BYTES
                || elapsed >= PROGRESS_LOG_MIN_INTERVAL
            {
                let pct = total_hint
                    .filter(|&t| t > 0)
                    .map(|t| (downloaded as f64 / t as f64) * 100.0)
                    .map(|p| format!("{p:.2}%"))
                    .unwrap_or_else(|| "n/a".to_string());
                crate::log_info!(
                    "download.progress path={} downloaded={} total={:?} approx_percent={} chunk_last={} elapsed_since_log_ms={}",
                    dest.display(),
                    downloaded,
                    total_hint,
                    pct,
                    chunk_len,
                    elapsed.as_millis()
                );
                last_progress_log = Instant::now();
                bytes_since_progress_log = 0;
            }
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
