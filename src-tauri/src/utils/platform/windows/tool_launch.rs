use std::path::PathBuf;

use crate::config::tools_manifest::ToolManifestEntry;

pub fn resolve_tool_launch_path(entry: &ToolManifestEntry) -> Result<PathBuf, String> {
    let spec = &entry.download_spec;
    let Some(win_reg) = spec.windows_product_registry.as_ref() else {
        return Err("tool has no windowsProductRegistry".to_string());
    };
    let install_root =
        crate::utils::platform::windows::registry::get_install_path(&win_reg.hklm_software_path)?;
    if let Some(steps) = spec.windows_zip_install_steps.as_ref() {
        let rel = steps
            .main_executable_relative
            .trim()
            .trim_start_matches(['/', '\\']);
        if rel.is_empty() {
            return Err("windowsZipInstallSteps.mainExecutableRelative is empty".to_string());
        }
        let exe = install_root.join(rel);
        if !exe.is_file() {
            return Err(format!("main executable not found: {}", exe.display()));
        }
        return Ok(exe);
    }
    if let Some(rel) = spec.windows_main_executable_relative.as_ref() {
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
            "InstallPath is a directory: set windowsZipInstallSteps or windowsMainExecutableRelative in tools_manifest.json"
                .to_string(),
        );
    }
    Err("invalid InstallPath from registry".to_string())
}
