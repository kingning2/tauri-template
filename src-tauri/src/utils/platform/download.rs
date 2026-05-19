use serde::{Deserialize, Serialize};

use std::fs::File;
use std::io;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum DownloadPayloadKind {
    Zip,
    Executable,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadArtifact {
    /// 直接下载地址；与 `downloadKey` 二选一。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    /// 下载解析 API 的 key，请求 `{downloadResolveBaseUrl}/{key}` 获取真实 `url`。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub download_key: Option<String>,
    /// 本地保存文件名；未填时从 `url`（含接口返回的 url）路径推导。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub file_name: Option<String>,
    pub kind: DownloadPayloadKind,
}

impl DownloadArtifact {
    pub fn has_download_source(&self) -> bool {
        self.url
            .as_ref()
            .is_some_and(|u| !u.trim().is_empty())
            || self
                .download_key
                .as_ref()
                .is_some_and(|k| !k.trim().is_empty())
    }
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

/// Windows：zip 解压后的收尾步骤（Uninstall/产品键、语言/gclid/Slint、防火墙；不写快捷方式）。
/// 与 `unlock-next-app/lifecycle/installer/src/ui_event.ts` 一致。
/// 解压后只要存在 [`PlatformDownloadSpec::windows_product_registry`] 即会执行；
/// 可显式配置本结构体，或由 `windowsMainExecutableRelative` + zip 文件名自动推导。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowsZipInstallSteps {
    /// 相对安装目录的主程序路径，例如 `Gbyte Unlock.exe`（用于校验解压结果是否完整）。
    pub main_executable_relative: String,
    /// 相对安装目录的卸载程序路径，例如 `uninstaller.exe`。
    pub uninstaller_relative: String,
    /// 控制面板「程序和功能」显示名称。
    pub display_name: String,
    pub publisher: String,
    pub display_version: String,
    /// 同时执行的防火墙 PowerShell 任务上限（与安装器 `add_firewall_rules(..., 8)` 一致）。
    /// 兼容旧字段名 `firewallScanMaxExes`。
    #[serde(
        default = "default_firewall_max_concurrent",
        alias = "firewallScanMaxExes"
    )]
    pub firewall_max_concurrent: u32,
    #[serde(default = "default_true")]
    pub write_lang_registry: bool,
    #[serde(default = "default_true")]
    pub write_gclid_from_env: bool,
    /// 写入 HKLM 产品键 `SlintRendererName`（与安装器 `ui_event.ts` 一致）；未配置则跳过。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub slint_renderer_name: Option<String>,
}

fn default_firewall_max_concurrent() -> u32 {
    8
}

fn default_true() -> bool {
    true
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
    /// Windows：当 `InstallPath` 为**安装目录**（常见于 MSI/安装器写入）且**没有**配置
    /// [`Self::windows_zip_install_steps`] 时，在此填写主程序相对该目录的路径，例如 `Gbyte Unlock.exe`。
    /// 与 zip 流程中的 `windowsZipInstallSteps.mainExecutableRelative` 二选一即可；若两者皆有，以 zip 步骤为准。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub windows_main_executable_relative: Option<String>,
    /// Windows：zip 解压后收尾的显式配置；未配置时从 `windows_main_executable_relative` 等字段推导。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub windows_zip_install_steps: Option<WindowsZipInstallSteps>,
    /// 使用 `downloadKey` 时的解析 API 根路径，默认 `https://download.gbyte.com/downloads`。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub download_resolve_base_url: Option<String>,
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
        return super::windows::download::is_tool_download_installed(spec);
    }

    #[cfg(target_os = "macos")]
    {
        return super::macos::download::is_tool_download_installed(spec, relative_dir);
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        let _ = (spec, relative_dir);
        Err("unsupported platform".to_string())
    }
}

/// 如果是可执行安装包：按平台 chmod（macOS）后用 `tokio::process` 拉起安装程序（不阻塞等待安装结束）。
pub async fn post_process_download_payload_if_needed(
    kind: DownloadPayloadKind,
    local_path: &str,
    spec: &PlatformDownloadSpec,
    relative_dir: &str,
) -> Result<(), String> {
    match kind {
        DownloadPayloadKind::Zip => {
            install_zip_payload_from_local_path(local_path, spec, relative_dir).await
        }
        DownloadPayloadKind::Executable => {
            #[cfg(target_os = "macos")]
            super::macos::download::chmod_installer_executable(local_path).await?;

            #[cfg(target_os = "macos")]
            return super::macos::download::run_downloaded_installer(local_path).await;

            #[cfg(target_os = "windows")]
            return super::windows::download::run_downloaded_installer(local_path).await;

            #[cfg(not(any(target_os = "windows", target_os = "macos")))]
            {
                let _ = (local_path, spec);
                Err("executable installer launch is not supported on this platform".to_string())
            }
        }
    }
}

/// 对下载到本地的 zip payload 做“安装前置处理”：
/// - **Windows**：解压到 `{ProgramFiles}\Gbyte\{产品目录}`（产品名来自注册表路径或 `relative_dir`）
/// - **其它平台**：解压到 zip 所在目录（`local_path` 的父目录）
/// - 解压成功后默认删除 AppData 中的原 zip 文件
async fn install_zip_payload_from_local_path(
    local_path: &str,
    spec: &PlatformDownloadSpec,
    relative_dir: &str,
) -> Result<(), String> {
    let zip_path = PathBuf::from(local_path);

    #[cfg(target_os = "windows")]
    let install_dir =
        super::windows::install_paths::program_files_gbyte_product_dir(spec, relative_dir)?;

    #[cfg(not(target_os = "windows"))]
    let install_dir = zip_path
        .parent()
        .ok_or_else(|| "zip local_path has no parent directory".to_string())?
        .to_path_buf();

    crate::log_info!(
        "zip.install_dir zip={} target={}",
        zip_path.display(),
        install_dir.display()
    );

    let remove_zip_after_install = true;

    unzip_zip_payload(&zip_path, &install_dir).await?;

    // Windows：写入 Uninstall / InstallPath / Lang / gclid / Slint / 防火墙（见 post_zip_install 模块文档）。
    #[cfg(target_os = "windows")]
    super::windows::download::run_zip_post_install_if_configured(&install_dir, spec).await?;

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

fn safe_out_path(install_dir: &Path, enclosed_name: &Path) -> Result<PathBuf, String> {
    use std::path::Component;

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

fn resolve_download_artifact_config_inner(
    spec: &PlatformDownloadSpec,
    platform: SystemPlatform,
    arch: SystemArch,
) -> Result<(SystemPlatform, SystemArch, DownloadArtifact), String> {
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

    if !artifact.has_download_source() {
        return Err(format!(
            "download source for platform `{}` arch `{}` has no url or downloadKey",
            platform.as_key(),
            arch.as_key()
        ));
    }

    Ok((platform, arch, artifact))
}

fn download_resolve_base_url(spec: &PlatformDownloadSpec) -> &str {
    spec.download_resolve_base_url
        .as_deref()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or(super::download_resolve::DEFAULT_DOWNLOAD_RESOLVE_BASE_URL)
}

async fn materialize_download_artifact(
    spec: &PlatformDownloadSpec,
    artifact: &DownloadArtifact,
) -> Result<(String, String), String> {
    if let Some(url) = artifact
        .url
        .as_ref()
        .map(|u| u.trim())
        .filter(|u| !u.is_empty())
    {
        let file_name = match artifact
            .file_name
            .as_ref()
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
        {
            Some(name) => name.to_string(),
            None => super::download_resolve::file_name_from_url(url)?,
        };
        return Ok((url.to_string(), file_name));
    }

    let key = artifact
        .download_key
        .as_deref()
        .map(str::trim)
        .filter(|k| !k.is_empty())
        .ok_or_else(|| "downloadKey is required when url is absent".to_string())?;

    let resolved = super::download_resolve::fetch_download_resolve(
        download_resolve_base_url(spec),
        key,
    )
    .await?;

    let url = resolved.url.trim().to_string();
    let file_name = match artifact
        .file_name
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        Some(name) => name.to_string(),
        None => super::download_resolve::file_name_from_url(&url)?,
    };

    Ok((url, file_name))
}

async fn resolve_download_artifact_inner(
    spec: &PlatformDownloadSpec,
    platform: SystemPlatform,
    arch: SystemArch,
) -> Result<ResolvedDownloadArtifact, String> {
    let (platform, arch, artifact) =
        resolve_download_artifact_config_inner(spec, platform, arch)?;
    let (url, file_name) = materialize_download_artifact(spec, &artifact).await?;

    Ok(ResolvedDownloadArtifact {
        platform: platform.as_key().to_string(),
        arch: arch.as_key().to_string(),
        url,
        file_name,
        kind: artifact.kind,
    })
}

pub async fn resolve_download_artifact(
    spec: &PlatformDownloadSpec,
) -> Result<ResolvedDownloadArtifact, String> {
    #[cfg(target_os = "windows")]
    {
        return resolve_download_artifact_inner(
            spec,
            crate::utils::platform::windows::download::current_platform()?,
            crate::utils::platform::windows::download::current_arch()?,
        )
        .await;
    }

    #[cfg(target_os = "macos")]
    {
        return resolve_download_artifact_inner(
            spec,
            crate::utils::platform::macos::download::current_platform()?,
            crate::utils::platform::macos::download::current_arch()?,
        )
        .await;
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        let _ = spec;
        Err("unsupported platform".to_string())
    }
}

/// 同步解析配置（不请求 downloadKey 接口）；用于仅需判断 artifact 是否存在的场景。
pub fn resolve_download_artifact_config(
    spec: &PlatformDownloadSpec,
) -> Result<(DownloadArtifact, DownloadPayloadKind), String> {
    #[cfg(target_os = "windows")]
    let (platform, arch) = (
        crate::utils::platform::windows::download::current_platform()?,
        crate::utils::platform::windows::download::current_arch()?,
    );

    #[cfg(target_os = "macos")]
    let (platform, arch) = (
        crate::utils::platform::macos::download::current_platform()?,
        crate::utils::platform::macos::download::current_arch()?,
    );

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    return Err("unsupported platform".to_string());

    let (_, _, artifact) = resolve_download_artifact_config_inner(spec, platform, arch)?;
    let kind = artifact.kind;
    Ok((artifact, kind))
}
