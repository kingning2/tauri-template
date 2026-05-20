//! 跨 Webview 工具下载态：存于 Rust，各 Webview 经 command / event 同步。

use std::collections::HashMap;
use std::sync::Mutex;

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use typeshare::typeshare;

#[typeshare]
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "lowercase")]
pub enum DownloadPhase {
    Idle,
    Downloading,
    Completed,
    Error,
}

#[typeshare]
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ToolDownloadEntry {
    pub phase: DownloadPhase,
    pub downloaded_bytes: i32,
    pub total_bytes: Option<i32>,
    pub saved_path: Option<String>,
    pub error: Option<String>,
    pub in_flight: bool,
}

impl ToolDownloadEntry {
    fn idle() -> Self {
        Self {
            phase: DownloadPhase::Idle,
            downloaded_bytes: 0,
            total_bytes: None,
            saved_path: None,
            error: None,
            in_flight: false,
        }
    }
}

#[typeshare]
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ToolsDownloadSnapshot {
    pub by_tool_id: HashMap<String, ToolDownloadEntry>,
}

pub struct ToolsDownloadStore(pub Mutex<HashMap<String, ToolDownloadEntry>>);

impl ToolsDownloadStore {
    pub fn new() -> Self {
        Self(Mutex::new(HashMap::new()))
    }
}

fn with_store<F, R>(app: &AppHandle, f: F) -> Result<R, String>
where
    F: FnOnce(&mut HashMap<String, ToolDownloadEntry>) -> R,
{
    let store = app.state::<ToolsDownloadStore>();
    let mut guard = store.0.lock().map_err(|e| e.to_string())?;
    Ok(f(&mut guard))
}

fn snapshot_from(map: &HashMap<String, ToolDownloadEntry>) -> ToolsDownloadSnapshot {
    ToolsDownloadSnapshot {
        by_tool_id: map.clone(),
    }
}

pub fn get_snapshot(app: &AppHandle) -> Result<ToolsDownloadSnapshot, String> {
    with_store(app, |map| snapshot_from(map))
}

pub fn mark_started(app: &AppHandle, tool_id: &str) -> Result<ToolsDownloadSnapshot, String> {
    with_store(app, |map| {
        map.insert(
            tool_id.to_string(),
            ToolDownloadEntry {
                phase: DownloadPhase::Downloading,
                downloaded_bytes: 0,
                total_bytes: None,
                saved_path: None,
                error: None,
                in_flight: true,
            },
        );
        snapshot_from(map)
    })
}

pub fn update_progress(
    app: &AppHandle,
    tool_id: &str,
    downloaded: i32,
    total: Option<i32>,
) -> Result<ToolsDownloadSnapshot, String> {
    with_store(app, |map| {
        let entry = map
            .entry(tool_id.to_string())
            .or_insert_with(ToolDownloadEntry::idle);
        entry.phase = DownloadPhase::Downloading;
        entry.downloaded_bytes = downloaded;
        if total.is_some() {
            entry.total_bytes = total;
        }
        entry.in_flight = true;
        snapshot_from(map)
    })
}

pub fn mark_completed(
    app: &AppHandle,
    tool_id: &str,
    saved_path: String,
) -> Result<ToolsDownloadSnapshot, String> {
    with_store(app, |map| {
        let entry = map
            .entry(tool_id.to_string())
            .or_insert_with(ToolDownloadEntry::idle);
        entry.phase = DownloadPhase::Completed;
        entry.saved_path = Some(saved_path);
        entry.error = None;
        entry.in_flight = false;
        snapshot_from(map)
    })
}

pub fn mark_failed(
    app: &AppHandle,
    tool_id: &str,
    error: String,
) -> Result<ToolsDownloadSnapshot, String> {
    with_store(app, |map| {
        let entry = map
            .entry(tool_id.to_string())
            .or_insert_with(ToolDownloadEntry::idle);
        entry.phase = DownloadPhase::Error;
        entry.error = Some(error);
        entry.in_flight = false;
        snapshot_from(map)
    })
}

pub fn reset_tool(app: &AppHandle, tool_id: &str) -> Result<ToolsDownloadSnapshot, String> {
    with_store(app, |map| {
        map.insert(tool_id.to_string(), ToolDownloadEntry::idle());
        snapshot_from(map)
    })
}

pub fn broadcast_snapshot(app: &AppHandle, snapshot: &ToolsDownloadSnapshot) -> Result<(), String> {
    crate::events::tools_download_changed_all(app, snapshot)
}

pub fn push_snapshot_to_webview(app: &AppHandle, webview_label: &str) -> Result<(), String> {
    let snapshot = get_snapshot(app)?;
    crate::events::tools_download_changed_to(app, webview_label, &snapshot)
}

/// 下载进度 Channel 回调内调用：更新 Rust 状态并广播。
pub fn sync_progress_and_broadcast(
    app: &AppHandle,
    tool_id: &str,
    downloaded: i32,
    total: Option<i32>,
) {
    if let Ok(snapshot) = update_progress(app, tool_id, downloaded, total) {
        let _ = broadcast_snapshot(app, &snapshot);
    }
}
