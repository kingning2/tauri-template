use std::path::PathBuf;

use crate::config::tools_manifest::ToolManifestEntry;

/// 仅从 HKLM `InstallPath` + 相对主程序名解析 exe；不读取 `tools_manifest`。
///
/// `windows_zip_main_executable_relative` 与 `windows_main_executable_relative` 的优先级与
/// [`PlatformDownloadSpec`](crate::utils::platform::download::PlatformDownloadSpec) 中 zip 步骤
/// 与 `windowsMainExecutableRelative` 一致：前者存在时优先。
pub fn resolve_executable_from_registry(
    hklm_software_path: &str,
    windows_zip_main_executable_relative: Option<&str>,
    windows_main_executable_relative: Option<&str>,
) -> Result<PathBuf, String> {
    let install_root =
        crate::utils::platform::windows::registry::get_install_path(hklm_software_path)?;
    if let Some(rel) = windows_zip_main_executable_relative {
        let rel = rel.trim().trim_start_matches(['/', '\\']);
        if rel.is_empty() {
            return Err("windowsZipMainExecutableRelative is empty".to_string());
        }
        let exe = install_root.join(rel);
        if !exe.is_file() {
            return Err(format!("main executable not found: {}", exe.display()));
        }
        return Ok(exe);
    }
    if let Some(rel) = windows_main_executable_relative {
        let rel = rel.trim().trim_start_matches(['/', '\\']);
        if !rel.is_empty() {
            let exe = install_root.join(rel);
            if !exe.is_file() {
                return Err(format!("main executable not found: {}", exe.display()));
            }
            return Ok(exe);
        }
    }
    if install_root.is_file() {
        return Ok(install_root);
    }
    if install_root.is_dir() {
        return Err(
            "InstallPath is a directory: pass windowsZipMainExecutableRelative or windowsMainExecutableRelative"
                .to_string(),
        );
    }
    Err("invalid InstallPath from registry".to_string())
}

pub fn resolve_tool_launch_path(entry: &ToolManifestEntry) -> Result<PathBuf, String> {
    let spec = &entry.download_spec;
    let Some(win_reg) = spec.windows_product_registry.as_ref() else {
        return Err("tool has no windowsProductRegistry".to_string());
    };
    resolve_executable_from_registry(
        &win_reg.hklm_software_path,
        spec.windows_zip_install_steps
            .as_ref()
            .map(|s| s.main_executable_relative.as_str()),
        spec.windows_main_executable_relative.as_deref(),
    )
}
