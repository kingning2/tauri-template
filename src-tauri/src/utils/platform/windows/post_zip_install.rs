//! Zip 落地并解压后，在 Windows 上执行的安装收尾：产品注册表、语言/gclid/渲染器、防火墙（与安装器 `system.rs` 防火墙逻辑对齐）。

use std::path::Path;

use crate::utils::platform::download::{WindowsProductRegistry, WindowsZipInstallSteps};
use crate::utils::platform::windows::firewall::add_firewall_rules;
use crate::utils::platform::windows::registry::{self, RegistryInstallValue};

fn read_launcher_lang_code() -> String {
    let path = match directories::ProjectDirs::from("com", "polymerization", "tauri-app") {
        Some(p) => p.data_local_dir().join("app_lang.txt"),
        None => return "cn".to_string(),
    };
    match std::fs::read_to_string(&path) {
        Ok(s) => {
            let s = s.trim();
            if matches!(s, "cn" | "en") {
                s.to_string()
            } else {
                "cn".to_string()
            }
        }
        Err(_) => "cn".to_string(),
    }
}

/// 解压后：Uninstall 注册表 → InstallPath → Lang / gclid / Slint → 防火墙（无桌面快捷方式）。
pub async fn run_windows_zip_post_install_steps(
    install_dir: &Path,
    steps: &WindowsZipInstallSteps,
    win_reg: &WindowsProductRegistry,
) -> Result<(), String> {
    let main_exe = install_dir.join(&steps.main_executable_relative);
    if !main_exe.is_file() {
        return Err(format!(
            "zip post-install: main executable not found: {}",
            main_exe.display()
        ));
    }

    let uninstaller = install_dir.join(&steps.uninstaller_relative);
    let uninstall_string = uninstaller
        .to_str()
        .ok_or_else(|| "uninstaller path is not valid utf-8".to_string())?
        .to_string();

    let install_location = install_dir
        .to_str()
        .ok_or_else(|| "install dir is not valid utf-8".to_string())?
        .to_string();

    // --- Uninstall 注册表 ---
    registry::registry_install(RegistryInstallValue {
        install_location: install_location.clone(),
        uninstall_string: uninstall_string.clone(),
        display_version: steps.display_version.clone(),
        display_name: steps.display_name.clone(),
        publisher: steps.publisher.clone(),
        uninstall_registry_subkey: win_reg.uninstall_subkey.clone(),
        shortcut_path: None,
    })
    .map_err(|e| format!("registry_install: {e}"))?;

    // --- 产品根键 InstallPath ---
    registry::registry_install_path(&win_reg.hklm_software_path, install_location.clone())
        .map_err(|e| format!("registry_install_path: {e}"))?;

    // --- Lang / gclid ---
    if steps.write_lang_registry {
        let lang = read_launcher_lang_code();
        let _ = registry::registry_lang(&win_reg.hklm_software_path, &lang)
            .inspect_err(|e| crate::log_warn!("registry_lang: {e}"));
    }

    if steps.write_gclid_from_env {
        if let Ok(gclid) = std::env::var("GCLID") {
            if !gclid.is_empty() {
                let _ = registry::registry_gclid_value(&win_reg.hklm_software_path, &gclid)
                    .inspect_err(|e| crate::log_warn!("registry_gclid: {e}"));
            }
        }
    }

    // --- 防火墙 ---
    let install_root = install_dir.to_path_buf();
    let max_con = steps.firewall_max_concurrent.max(1) as usize;
    let rule_prefix = win_reg.uninstall_subkey.clone();
    match add_firewall_rules(&install_root, max_con, &rule_prefix).await {
        Ok(res) => {
            crate::log_info!(
                "firewall.done rules_ok={} rules_failed={}",
                res.success_exes.len(),
                res.failed_exes.len()
            );
            if !res.success {
                for f in &res.failed_exes {
                    crate::log_warn!(
                        "firewall.rule_failed direction={} path={}",
                        f.direction,
                        f.path.display()
                    );
                }
            }
        }
        Err(e) => crate::log_warn!("firewall.add_firewall_rules err: {e}"),
    }

    Ok(())
}
