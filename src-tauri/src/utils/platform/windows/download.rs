use std::env::consts::{ARCH, OS};
use std::path::{Path, PathBuf};
use std::process::Stdio;

use crate::utils::platform::download::{PlatformDownloadSpec, SystemArch, SystemPlatform};
use crate::utils::platform::windows::registry;

/// 当前平台
pub fn current_platform() -> Result<SystemPlatform, String> {
    match OS {
        "windows" => Ok(SystemPlatform::Windows),
        other => Err(format!("unsupported platform for windows resolver: {other}")),
    }
}

/// 当前架构
pub fn current_arch() -> Result<SystemArch, String> {
    match ARCH {
        "x86_64" => Ok(SystemArch::X64),
        "aarch64" => Ok(SystemArch::Arm64),
        other => Err(format!("unsupported architecture on windows resolver: {other}")),
    }
}

/// 判断工具是否已安装
pub fn is_tool_download_installed(spec: &PlatformDownloadSpec) -> Result<bool, String> {
    let Some(win) = spec.windows_product_registry.as_ref() else {
        return Ok(false);
    };
    if !registry::registry_install_exist(&win.uninstall_subkey) {
        return Ok(false);
    }
    Ok(match registry::get_install_path(&win.hklm_software_path) {
        Ok(p) => p.is_dir(),
        Err(_) => true,
    })
}

/// 运行下载的安装器
pub async fn run_downloaded_installer(local_path: &str) -> Result<(), String> {
    let path = PathBuf::from(local_path);
    if !path.is_file() {
        return Err(format!("installer path is not a file: {local_path}"));
    }

    let file_lower = path
        .file_name()
        .and_then(|n| n.to_str())
        .map(|s| s.to_ascii_lowercase())
        .unwrap_or_default();

    let mut cmd = if file_lower.ends_with(".msi") {
        let msiexec = match std::env::var("SystemRoot") {
            Ok(root) => PathBuf::from(root).join("System32").join("msiexec.exe"),
            Err(_) => PathBuf::from("msiexec.exe"),
        };
        let mut c = tokio::process::Command::new(msiexec);
        c.arg("/i").arg(&path);
        c
    } else {
        tokio::process::Command::new(&path)
    };

    cmd.stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("failed to spawn Windows installer: {e}"))?;

    tokio::spawn(async move {
        let _ = child.wait().await;
    });
    Ok(())
}

/// 运行下载的安装器后，运行 zip 安装步骤
pub async fn run_zip_post_install_if_configured(
    install_dir: &Path,
    spec: &PlatformDownloadSpec,
) -> Result<(), String> {
    if let (Some(ref zip_steps), Some(ref win_reg)) = (
        spec.windows_zip_install_steps.as_ref(),
        spec.windows_product_registry.as_ref(),
    ) {
        super::post_zip_install::run_windows_zip_post_install_steps(
            install_dir,
            zip_steps,
            win_reg,
        )
        .await?;
    }
    Ok(())
}
