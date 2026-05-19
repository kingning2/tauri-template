//! Modal 子窗口创建与生命周期（parent=main，会话推送，主窗蒙层事件）。

use std::sync::atomic::{AtomicU32, Ordering};

use serde::Serialize;
use tauri::{
    AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent,
};

use crate::utils::session;

pub const MAIN_WINDOW_LABEL: &str = "main";
pub const MODAL_OPENED_EVENT: &str = "modal/opened";
pub const MODAL_CLOSED_EVENT: &str = "modal/closed";

static MODAL_SEQ: AtomicU32 = AtomicU32::new(0);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ModalEventPayload {
    label: String,
}

fn normalize_path(path: &str) -> String {
    if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{path}")
    }
}

fn resolve_modal_url(app: &AppHandle, path: &str) -> Result<WebviewUrl, String> {
    let path = normalize_path(path);

    #[cfg(debug_assertions)]
    {
        let dev_url = app
            .config()
            .build
            .dev_url
            .as_ref()
            .ok_or_else(|| "build.devUrl is missing in tauri.conf.json".to_string())?;
        let base = dev_url.as_str().trim_end_matches('/');
        let full = format!("{base}{path}");
        full.parse::<url::Url>()
            .map(WebviewUrl::External)
            .map_err(|e| format!("invalid modal url `{full}`: {e}"))
    }

    #[cfg(not(debug_assertions))]
    {
        Ok(WebviewUrl::App(path.into()))
    }
}

fn next_modal_label(label: Option<String>) -> String {
    label.unwrap_or_else(|| {
        let n = MODAL_SEQ.fetch_add(1, Ordering::Relaxed) + 1;
        format!("modal-{n}")
    })
}

fn register_modal_destroy_listener(app: &AppHandle, label: &str) {
    let Some(window) = app.get_webview_window(label) else {
        return;
    };
    let app_handle = app.clone();
    let label_owned = label.to_string();
    window.on_window_event(move |event| {
        if let WindowEvent::Destroyed = event {
            let _ = app_handle.emit_to(
                MAIN_WINDOW_LABEL,
                MODAL_CLOSED_EVENT,
                ModalEventPayload {
                    label: label_owned.clone(),
                },
            );
        }
    });
}

pub fn open_modal_window(
    app: &AppHandle,
    path: String,
    title: Option<String>,
    width: Option<f64>,
    height: Option<f64>,
    label: Option<String>,
) -> Result<String, String> {
    let label = next_modal_label(label);

    if let Some(existing) = app.get_webview_window(&label) {
        existing.set_focus().map_err(|e| e.to_string())?;
        return Ok(label);
    }

    let parent = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| format!("{MAIN_WINDOW_LABEL} window not found"))?;

    let url = resolve_modal_url(app, &path)?;
    let width = width.unwrap_or(520.0);
    let height = height.unwrap_or(400.0);
    let title = title.unwrap_or_else(|| "Modal".to_string());

    WebviewWindowBuilder::new(app, &label, url)
        .title(title)
        .inner_size(width, height)
        .center()
        .decorations(false)
        .transparent(true)
        .resizable(false)
        .shadow(false)
        .parent(&parent)
        .map_err(|e| e.to_string())?
        .build()
        .map_err(|e| e.to_string())?;

    register_modal_destroy_listener(app, &label);
    session::push_session_to_webview(app, &label)?;

    app.emit_to(
        MAIN_WINDOW_LABEL,
        MODAL_OPENED_EVENT,
        ModalEventPayload {
            label: label.clone(),
        },
    )
    .map_err(|e| e.to_string())?;

    Ok(label)
}

pub fn close_modal_window(app: &AppHandle, label: &str) -> Result<(), String> {
    let window = app
        .get_webview_window(label)
        .ok_or_else(|| format!("modal window not found: {label}"))?;
    window.close().map_err(|e| e.to_string())?;
    // 部分平台 Destroyed 回调不稳定，关闭时主动向主窗发 closed 收起蒙层
    let _ = app.emit_to(
        MAIN_WINDOW_LABEL,
        MODAL_CLOSED_EVENT,
        ModalEventPayload {
            label: label.to_string(),
        },
    );
    Ok(())
}
