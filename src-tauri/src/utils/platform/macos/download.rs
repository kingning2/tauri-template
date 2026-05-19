use std::env::consts::{ARCH, OS};
use std::path::{Component, Path, PathBuf};
use std::process::Stdio;

use tokio::fs;

use crate::utils::download::tools_download_base_dir;
use crate::utils::platform::download::{
    resolve_download_artifact_config, DownloadPayloadKind, PlatformDownloadSpec,
};

pub fn current_platform() -> Result<SystemPlatform, String> {
    match OS {
        "macos" => Ok(SystemPlatform::MacOS),
        other => Err(format!("unsupported platform for macos resolver: {other}")),
    }
}

pub fn current_arch() -> Result<SystemArch, String> {
    match ARCH {
        "x86_64" => Ok(SystemArch::X64),
        "aarch64" => Ok(SystemArch::Arm64),
        other => Err(format!("unsupported architecture on macos resolver: {other}")),
    }
}

/// 判断工具是否已安装
pub fn is_tool_download_installed(
    spec: &PlatformDownloadSpec,
    relative_dir: &str,
) -> Result<bool, String> {
    if let Some(ref p) = spec.macos_installed_bundle_path {
        return Ok(Path::new(p).exists());
    }

    let (artifact, _) = resolve_download_artifact_config(spec)?;
    let file_name = artifact
        .file_name
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .ok_or_else(|| {
            "fileName is required for macOS install check when macosInstalledBundlePath is unset and url is configured directly".to_string()
        })?;
    let rel = build_tool_relative_download_path(relative_dir, file_name)?;
    let base = tools_download_base_dir()?;
    let artifact_path = base.join(rel);

    let installed = match artifact.kind {
        DownloadPayloadKind::Executable => artifact_path.is_file(),
        DownloadPayloadKind::Zip => {
            let install_dir = artifact_path.parent().ok_or_else(|| {
                "invalid artifact path: expected a file path with a parent directory".to_string()
            })?;

            if artifact_path.is_file() {
                false
            } else if !install_dir.is_dir() {
                false
            } else {
                let mut entries = std::fs::read_dir(install_dir).map_err(|e| e.to_string())?;
                entries.next().is_some()
            }
        }
    };
    Ok(installed)
}

/// 构建工具相对下载路径
fn build_tool_relative_download_path(
    relative_dir: &str,
    file_name: &str,
) -> Result<String, String> {
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

    ensure_tool_relative_path_safe(&rel)?;
    Ok(rel)
}

/// 确保工具相对路径安全
fn ensure_tool_relative_path_safe(rel: &str) -> Result<(), String> {
    if rel.is_empty() || rel.contains("..") {
        return Err("invalid relative path".to_string());
    }
    let p = PathBuf::from(rel);
    if p.is_absolute() {
        return Err("invalid relative path: absolute path is not allowed".to_string());
    }
    if p.components().any(|c| matches!(c, Component::ParentDir)) {
        return Err("invalid relative path".to_string());
    }
    Ok(())
}

/// 修改安装器可执行权限
pub async fn chmod_installer_executable(local_path: &str) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;

    fs::set_permissions(local_path, std::fs::Permissions::from_mode(0o755))
        .await
        .map_err(|e| e.to_string())
}

/// 运行下载的安装器
pub async fn run_downloaded_installer(local_path: &str) -> Result<(), String> {
    let path = PathBuf::from(local_path);
    if !path.is_file() {
        return Err(format!("installer path is not a file: {local_path}"));
    }

    let lower = local_path.to_ascii_lowercase();
    let mut cmd = if lower.ends_with(".dmg") || lower.ends_with(".pkg") || lower.ends_with(".app")
    {
        let mut c = tokio::process::Command::new("/usr/bin/open");
        c.arg(local_path);
        c
    } else {
        tokio::process::Command::new(&path)
    };

    cmd.stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("failed to spawn macOS installer: {e}"))?;

    tokio::spawn(async move {
        let _ = child.wait().await;
    });
    Ok(())
}
