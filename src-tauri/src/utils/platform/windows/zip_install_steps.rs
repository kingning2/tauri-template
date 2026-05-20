//! 解析 zip 解压后收尾步骤（[`WindowsZipInstallSteps`]）。
//!
//! 与 `unlock-next-app/lifecycle/installer/src/ui_event.ts` 一致：清单可显式配置
//! `windowsZipInstallSteps`；未配置时从 `windowsMainExecutableRelative` 与 zip 文件名推导默认值。

use crate::utils::platform::download::{PlatformDownloadSpec, WindowsZipInstallSteps};

const DEFAULT_PUBLISHER: &str = "Gbyte";
const DEFAULT_UNINSTALLER_RELATIVE: &str = "uninstall.exe";

/// 合并清单中的显式步骤，或根据 `windowsMainExecutableRelative` / 下载包文件名生成默认步骤。
pub fn resolve_windows_zip_install_steps(
    spec: &PlatformDownloadSpec,
) -> Result<WindowsZipInstallSteps, String> {
    if let Some(ref steps) = spec.windows_zip_install_steps {
        return Ok(steps.clone());
    }

    let main_executable_relative = spec
        .windows_main_executable_relative
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .ok_or_else(|| {
            "zip post-install requires windowsZipInstallSteps or windowsMainExecutableRelative"
                .to_string()
        })?
        .to_string();

    let display_version = spec
        .windows
        .as_ref()
        .and_then(|w| w.universal.as_ref())
        .and_then(|a| a.file_name.as_deref())
        .map(parse_display_version_from_file_name)
        .unwrap_or_else(|| "1.0.0".to_string());

    let display_name = spec
        .windows_product_registry
        .as_ref()
        .map(|r| display_name_from_hklm_path(&r.hklm_software_path))
        .unwrap_or_else(|| DEFAULT_PUBLISHER.to_string());

    Ok(WindowsZipInstallSteps {
        main_executable_relative,
        uninstaller_relative: DEFAULT_UNINSTALLER_RELATIVE.to_string(),
        display_name,
        publisher: DEFAULT_PUBLISHER.to_string(),
        display_version,
        firewall_max_concurrent: 8,
        write_lang_registry: true,
        write_gclid_from_env: true,
        slint_renderer_name: None,
    })
}

/// `SOFTWARE\Gbyte\Repair` → `Gbyte Repair`（与安装器控制面板显示名一致）。
fn display_name_from_hklm_path(hklm_software_path: &str) -> String {
    let normalized = hklm_software_path.replace('/', "\\");
    let last = normalized
        .split('\\')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .last()
        .unwrap_or(DEFAULT_PUBLISHER);

    if last.eq_ignore_ascii_case("Gbyte") || last.eq_ignore_ascii_case("SOFTWARE") {
        return DEFAULT_PUBLISHER.to_string();
    }
    format!("{DEFAULT_PUBLISHER} {last}")
}

/// 从 zip 文件名提取版本号，例如 `Gbyte_Repair_1.0.2_Setup_Win.zip` → `1.0.2`。
fn parse_display_version_from_file_name(file_name: &str) -> String {
    for part in file_name.split(['_', '-']) {
        if part.chars().all(|c| c.is_ascii_digit() || c == '.')
            && part.contains('.')
            && part
                .split('.')
                .all(|seg| !seg.is_empty() && seg.chars().all(|c| c.is_ascii_digit()))
        {
            return part.to_string();
        }
    }
    "1.0.0".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::platform::download::{
        DownloadArtifact, DownloadPayloadKind, PlatformArtifacts, WindowsProductRegistry,
    };

    #[test]
    fn parses_version_from_zip_name() {
        assert_eq!(
            parse_display_version_from_file_name("Gbyte_Repair_1.0.2_Setup_Win.zip"),
            "1.0.2"
        );
    }

    #[test]
    fn builds_display_name_from_registry_path() {
        assert_eq!(
            display_name_from_hklm_path(r"SOFTWARE\Gbyte\Repair"),
            "Gbyte Repair"
        );
    }

    #[test]
    fn resolves_steps_from_main_executable_relative() {
        let spec = PlatformDownloadSpec {
            windows: Some(PlatformArtifacts {
                universal: Some(DownloadArtifact {
                    url: Some("https://example.com/a.zip".to_string()),
                    download_key: None,
                    file_name: Some("Gbyte_Repair_1.0.2_Setup_Win.zip".to_string()),
                    kind: DownloadPayloadKind::Zip,
                }),
                ..Default::default()
            }),
            windows_product_registry: Some(WindowsProductRegistry {
                hklm_software_path: "SOFTWARE\\Gbyte\\Repair".to_string(),
                uninstall_subkey: "gbyte_repair".to_string(),
            }),
            windows_main_executable_relative: Some("repair.exe".to_string()),
            ..Default::default()
        };
        let steps = resolve_windows_zip_install_steps(&spec).unwrap();
        assert_eq!(steps.main_executable_relative, "repair.exe");
        assert_eq!(steps.display_version, "1.0.2");
        assert_eq!(steps.display_name, "Gbyte Repair");
    }
}
