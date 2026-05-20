//! Windows 安装目录解析（`Program Files\Gbyte\...`）。

use std::path::PathBuf;

use crate::utils::platform::download::PlatformDownloadSpec;

const GBYTE_DIR_NAME: &str = "Gbyte";

/// Zip 解压目标：`{ProgramFiles}\Gbyte\{产品目录}`。
///
/// 产品目录优先取 [`PlatformDownloadSpec::windows_product_registry`] 的
/// `hklmSoftwarePath` 最后一段（如 `SOFTWARE\Gbyte\Repair` → `Repair`），
/// 否则回退为工具 `relative_dir`（清单 `id`）。
pub fn program_files_gbyte_product_dir(
    spec: &PlatformDownloadSpec,
    relative_dir: &str,
) -> Result<PathBuf, String> {
    let program_files = std::env::var("ProgramFiles")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(r"C:\Program Files"));
    let product = product_folder_name(spec, relative_dir)?;
    Ok(program_files.join(GBYTE_DIR_NAME).join(product))
}

fn product_folder_name(spec: &PlatformDownloadSpec, relative_dir: &str) -> Result<String, String> {
    if let Some(win) = spec.windows_product_registry.as_ref() {
        if let Some(name) = last_registry_path_segment(&win.hklm_software_path) {
            return Ok(name);
        }
    }

    let id = relative_dir.trim();
    if id.is_empty() {
        return Err(
            "relative_dir is required when windows_product_registry is missing or has no product segment"
                .to_string(),
        );
    }
    Ok(id.to_string())
}

fn last_registry_path_segment(hklm_software_path: &str) -> Option<String> {
    let normalized = hklm_software_path.replace('/', "\\");
    let last = normalized
        .split('\\')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .last()?;

    if last.eq_ignore_ascii_case(GBYTE_DIR_NAME) || last.eq_ignore_ascii_case("SOFTWARE") {
        return None;
    }
    Some(last.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::platform::download::{PlatformDownloadSpec, WindowsProductRegistry};

    #[test]
    fn resolves_repair_under_program_files_gbyte() {
        let spec = PlatformDownloadSpec {
            windows_product_registry: Some(WindowsProductRegistry {
                hklm_software_path: "SOFTWARE\\Gbyte\\Repair".to_string(),
                uninstall_subkey: "gbyte_repair".to_string(),
            }),
            ..Default::default()
        };
        let dir = program_files_gbyte_product_dir(&spec, "system-repair").unwrap();
        assert!(dir.ends_with("Gbyte\\Repair") || dir.ends_with("Gbyte/Repair"));
    }

    #[test]
    fn falls_back_to_relative_dir_without_registry() {
        let spec = PlatformDownloadSpec::default();
        let dir = program_files_gbyte_product_dir(&spec, "system-repair").unwrap();
        assert!(dir.ends_with("Gbyte\\system-repair") || dir.ends_with("Gbyte/system-repair"));
    }
}
