use serde::{Deserialize, Serialize};

use std::fs::File;
use std::io;
use std::path::{Component, Path, PathBuf};
use std::process::Stdio;

#[cfg(target_os = "macos")]
use crate::utils::download::tools_download_base_dir;

#[cfg(target_os = "macos")]
use tokio::fs;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum DownloadPayloadKind {
    Zip,
    Executable,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadArtifact {
    pub url: String,
    pub file_name: String,
    pub kind: DownloadPayloadKind,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformArtifacts {
    pub universal: Option<DownloadArtifact>,
    pub x64: Option<DownloadArtifact>,
    pub arm64: Option<DownloadArtifact>,
}

impl PlatformArtifacts {
    pub fn resolve_for_arch(&self, arch: SystemArch) -> Option<DownloadArtifact> {
        match arch {
            SystemArch::X64 => self.x64.clone().or_else(|| self.universal.clone()),
            SystemArch::Arm64 => self.arm64.clone().or_else(|| self.universal.clone()),
        }
    }
}

/// Windows：按「产品」区分的注册表位置（与安装器写入的 `Uninstall` 子键 + `HKLM\SOFTWARE\...` 数据根一致）。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowsProductRegistry {
    /// 例如 `SOFTWARE\Gbyte\Unlock`（从 HKLM 起算的相对路径，与安装器 `REGISTRY_DATA_ROOT` 同形）。
    pub hklm_software_path: String,
    /// `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{此值}` 下的子键名，例如 `gbyte_unlock`。
    pub uninstall_subkey: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ToolVariant {
    HeroLeft,
    Medium,
    Small,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformDownloadSpec {
    pub windows: Option<PlatformArtifacts>,
    pub macos: Option<PlatformArtifacts>,
    /// Windows：未配置则无法在注册表维度判定「已安装」（返回 `false`）。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub windows_product_registry: Option<WindowsProductRegistry>,
    /// macOS：若填写（例如 `/Applications/Gbyte Unlock.app`），「已安装」以该路径存在为准；
    /// 不写则回退为工具下载目录下的落地/解压判断。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub macos_installed_bundle_path: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SystemPlatform {
    Windows,
    MacOS,
}

impl SystemPlatform {
    pub fn as_key(self) -> &'static str {
        match self {
            Self::Windows => "windows",
            Self::MacOS => "macos",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SystemArch {
    X64,
    Arm64,
}

impl SystemArch {
    pub fn as_key(self) -> &'static str {
        match self {
            Self::X64 => "x64",
            Self::Arm64 => "arm64",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedDownloadArtifact {
    pub platform: String,
    pub arch: String,
    pub url: String,
    pub file_name: String,
    pub kind: DownloadPayloadKind,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformDownloadResult {
    pub save_path: String,
    pub artifact: ResolvedDownloadArtifact,
}

/// 判断「是否已安装」：
///
/// - **Windows**：依赖 [`PlatformDownloadSpec::windows_product_registry`]（按产品配置，不得写死在库内）。
///   判定：`Uninstall\{uninstall_subkey}` 存在，且（若能读到）`hklm_software_path` 下 `InstallPath` 指向的目录存在；
///   若读不到 `InstallPath`，则仅以卸载项存在为准。
/// - **macOS**：若设置了 [`PlatformDownloadSpec::macos_installed_bundle_path`]，则该路径存在即视为已安装；
///   否则回退为工具下载目录下的落地/解压判断。
pub fn is_tool_download_installed(
    spec: &PlatformDownloadSpec,
    relative_dir: &str,
) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let _ = relative_dir;
        let Some(win) = spec.windows_product_registry.as_ref() else {
            return Ok(false);
        };
        if !crate::utils::platform::windows::registry::registry_install_exist(&win.uninstall_subkey)
        {
            return Ok(false);
        }
        return Ok(
            match crate::utils::platform::windows::registry::get_install_path(
                &win.hklm_software_path,
            ) {
                Ok(p) => p.is_dir(),
                Err(_) => true,
            },
        );
    }

    #[cfg(target_os = "macos")]
    {
        if let Some(ref p) = spec.macos_installed_bundle_path {
            return Ok(Path::new(p).exists());
        }

        let artifact = resolve_download_artifact(spec)?;
        let rel = build_tool_relative_download_path(relative_dir, &artifact.file_name)?;
        let base = tools_download_base_dir()?;
        let artifact_path = base.join(rel);

        let installed = match artifact.kind {
            DownloadPayloadKind::Executable => artifact_path.is_file(),
            DownloadPayloadKind::Zip => {
                let install_dir = artifact_path.parent().ok_or_else(|| {
                    "invalid artifact path: expected a file path with a parent directory"
                        .to_string()
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
        return Ok(installed);
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        let _ = (spec, relative_dir);
        Err("unsupported platform".to_string())
    }
}

/// 将 `relative_dir` + `file_name` 拼成与下载逻辑一致的相对路径，并做安全校验。
#[cfg(target_os = "macos")]
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

#[cfg(target_os = "macos")]
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

/// 如果是可执行安装包：按平台 chmod（macOS）后用 `tokio::process` 拉起安装程序（不阻塞等待安装结束）。
pub async fn post_process_download_payload_if_needed(
    kind: DownloadPayloadKind,
    local_path: &str,
) -> Result<(), String> {
    match kind {
        // 解压zip
        DownloadPayloadKind::Zip => install_zip_payload_from_local_path(local_path).await,
        // 可执行安装包
        DownloadPayloadKind::Executable => {
            #[cfg(target_os = "macos")]
            {
                use std::os::unix::fs::PermissionsExt;

                fs::set_permissions(local_path, std::fs::Permissions::from_mode(0o755))
                    .await
                    .map_err(|e| e.to_string())?;
            }

            run_downloaded_installer(local_path).await
        }
    }
}

/// 启动已下载的安装包（GUI 安装器在子任务里 `wait`，避免僵尸进程）。
///
/// - **Windows**：`.msi` → `msiexec /i <path>`；其余扩展名 →直接执行该路径。
/// - **macOS**：`.dmg` / `.pkg` / `.app` → `open <path>`；其余（如 `.sh`、Mach-O）→ 直接执行路径（需已 chmod）。
async fn run_downloaded_installer(local_path: &str) -> Result<(), String> {
    let path = PathBuf::from(local_path);
    if !path.is_file() {
        return Err(format!("installer path is not a file: {local_path}"));
    }

    let file_lower = path
        .file_name()
        .and_then(|n| n.to_str())
        .map(|s| s.to_ascii_lowercase())
        .unwrap_or_default();

    #[cfg(target_os = "windows")]
    {
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
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        let lower = local_path.to_ascii_lowercase();
        let mut cmd = if lower.ends_with(".dmg")
            || lower.ends_with(".pkg")
            || lower.ends_with(".app")
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
        return Ok(());
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        let _ = (local_path, file_lower);
        Err("executable installer launch is not supported on this platform".to_string())
    }
}

/// 对下载到本地的 zip payload 做“安装前置处理”：
/// 1) 以 `local_path` 的父目录作为安装目录；
/// 2) 解压到安装目录；
/// 3) 解压成功后默认删除原 zip 文件（避免重复占空间）。
async fn install_zip_payload_from_local_path(local_path: &str) -> Result<(), String> {
    // local_path 指向 zip 文件本体。
    let zip_path = PathBuf::from(local_path);
    let install_dir = zip_path
        .parent()
        .ok_or_else(|| "zip local_path has no parent directory".to_string())?
        .to_path_buf();

    // 约定：解压到 zip 所在目录（通常会是 `{app_data}/tool-downloads/{tool-id}/`）
    let remove_zip_after_install = true;

    unzip_zip_payload(&zip_path, &install_dir).await?;

    if remove_zip_after_install {
        tokio::fs::remove_file(&zip_path)
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// 解压 zip 文件到目标目录（异步封装，内部用 `spawn_blocking` 避免阻塞 Tokio 线程）。
async fn unzip_zip_payload(zip_path: &Path, install_dir: &Path) -> Result<(), String> {
    let zip_path = zip_path.to_path_buf();
    let install_dir = install_dir.to_path_buf();

    tokio::task::spawn_blocking(move || unzip_zip_payload_sync(&zip_path, &install_dir))
        .await
        .map_err(|e| format!("unzip spawn_blocking join error: {e}"))??;

    Ok(())
}

/// 同步解压实现。
/// - 会确保每个 zip entry 都被解压到 `install_dir` 内部（防止 `../` 路径穿越）。
fn unzip_zip_payload_sync(zip_path: &Path, install_dir: &Path) -> Result<(), String> {
    std::fs::create_dir_all(install_dir).map_err(|e| e.to_string())?;

    let file = File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;

        // `enclosed_name` 会返回解压时相对目标目录的安全路径（不包含前导 `/` 等）。
        // 这里再额外做一次穿越防护，避免把文件写出 install_dir。
        let name = file
            .enclosed_name()
            .ok_or_else(|| format!("zip entry has invalid name (index={i})"))?;

        let out_path = safe_out_path(install_dir, &name)?;

        if file.name().ends_with('/') {
            std::fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
            continue;
        }

        if let Some(parent) = out_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        let mut out_file = File::create(&out_path).map_err(|e| e.to_string())?;
        io::copy(&mut file, &mut out_file).map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// 将 zip entry 的相对路径解析成安全的输出路径：
/// - 拒绝绝对路径；
/// - 拒绝包含 `..`/Root/Prefix 等非法组件；
/// - 最终输出路径保证落在 `install_dir` 下。
fn safe_out_path(install_dir: &Path, enclosed_name: &Path) -> Result<PathBuf, String> {
    // 拒绝绝对路径 / 根路径 / 以及任何 `..` 路径穿越。
    if enclosed_name.is_absolute() {
        return Err("zip entry path must be relative".to_string());
    }

    if enclosed_name.components().any(|c| {
        matches!(
            c,
            Component::ParentDir | Component::RootDir | Component::Prefix(_)
        )
    }) {
        return Err("zip entry path contains invalid components".to_string());
    }

    Ok(install_dir.join(enclosed_name))
}

#[cfg(target_os = "windows")]
fn detect_current_platform() -> Result<SystemPlatform, String> {
    crate::utils::platform::windows::download::current_platform()
}

#[cfg(target_os = "macos")]
fn detect_current_platform() -> Result<SystemPlatform, String> {
    crate::utils::platform::macos::download::current_platform()
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn detect_current_platform() -> Result<SystemPlatform, String> {
    Err("unsupported platform".to_string())
}

#[cfg(target_os = "windows")]
fn detect_current_arch() -> Result<SystemArch, String> {
    crate::utils::platform::windows::download::current_arch()
}

#[cfg(target_os = "macos")]
fn detect_current_arch() -> Result<SystemArch, String> {
    crate::utils::platform::macos::download::current_arch()
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn detect_current_arch() -> Result<SystemArch, String> {
    Err("unsupported architecture".to_string())
}

pub fn resolve_download_artifact(
    spec: &PlatformDownloadSpec,
) -> Result<ResolvedDownloadArtifact, String> {
    let platform = detect_current_platform()?;
    let arch = detect_current_arch()?;

    let platform_artifacts = match platform {
        SystemPlatform::Windows => spec.windows.as_ref(),
        SystemPlatform::MacOS => spec.macos.as_ref(),
    }
    .ok_or_else(|| {
        format!(
            "download source for platform `{}` is missing",
            platform.as_key()
        )
    })?;

    let artifact = platform_artifacts.resolve_for_arch(arch).ok_or_else(|| {
        format!(
            "download source for platform `{}` arch `{}` is missing",
            platform.as_key(),
            arch.as_key()
        )
    })?;

    Ok(ResolvedDownloadArtifact {
        platform: platform.as_key().to_string(),
        arch: arch.as_key().to_string(),
        url: artifact.url,
        file_name: artifact.file_name,
        kind: artifact.kind,
    })
}
