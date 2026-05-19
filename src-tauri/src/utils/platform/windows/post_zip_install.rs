//! Windows：zip 解压到 `Program Files\Gbyte\...` 之后的安装收尾。
//!
//! 行为与 `unlock-next-app/lifecycle/installer/src/ui_event.ts` 中 zip 安装完成分支一致
//! （对应 Rust 安装器 `system.rs` 的注册表与防火墙逻辑；**不创建桌面快捷方式**）。
//!
//! ## 调用时机
//!
//! 由 [`crate::utils::platform::download::install_zip_payload_from_local_path`] 在解压成功后调用；
//! 要求清单中已配置 [`PlatformDownloadSpec::windows_product_registry`]，且能解析出
//! [`WindowsZipInstallSteps`]（显式 `windowsZipInstallSteps` 或由 `windowsMainExecutableRelative` 推导）。
//!
//! ## 处理步骤（按顺序）
//!
//! 1. **校验落地文件**：确认 `mainExecutableRelative` 在安装目录下存在，否则报错中止。
//! 2. **「程序和功能」卸载项**（`HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{uninstallSubkey}`）：
//!    - `DisplayName`、`Publisher`、`DisplayVersion`
//!    - `InstallLocation`：安装目录（`C:\Program Files\Gbyte\...`）
//!    - `UninstallString` / `DisplayIcon`：卸载程序绝对路径
//! 3. **产品数据根键**（`HKLM\{hklmSoftwarePath}`，如 `SOFTWARE\Gbyte\Repair`）：
//!    - `InstallPath`：与上相同的安装目录（启动器通过此键解析主程序路径）
//!    - `Lang`：启动器语言 `cn` / `en`（读 `%LOCALAPPDATA%\com.polymerization.gybte\app_lang.txt`）
//!    - `gclid`：若进程环境变量 `GCLID` 非空则写入
//!    - `SlintRendererName`：若清单配置了 `slintRendererName` 则写入
//! 4. **防火墙**：对安装目录下递归枚举的每个 `.exe` 添加入站/出站允许规则（并发上限默认 8）。

use std::path::Path;

use crate::utils::platform::download::{WindowsProductRegistry, WindowsZipInstallSteps};
use crate::utils::platform::windows::firewall::add_firewall_rules;
use crate::utils::platform::windows::registry::{self, RegistryInstallValue};

/// 读取启动器当前语言，供写入产品注册表 `Lang`。
fn read_launcher_lang_code() -> String {
    let path = match directories::ProjectDirs::from("com", "polymerization", "gybte") {
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

/// 执行 zip 解压后的注册表、语言/gclid/Slint、防火墙收尾（见模块级文档）。
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

    crate::log_info!(
        "zip.post_install start install_dir={} hklm={} uninstall_subkey={}",
        install_location,
        win_reg.hklm_software_path,
        win_reg.uninstall_subkey
    );

    // --- 2. Uninstall 注册表（控制面板可见） ---
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

    // --- 3a. 产品键 InstallPath（启动器读此路径定位已安装程序） ---
    registry::registry_install_path(&win_reg.hklm_software_path, install_location.clone())
        .map_err(|e| format!("registry_install_path: {e}"))?;

    crate::log_info!(
        "zip.post_install registry InstallPath={} -> {}",
        win_reg.hklm_software_path,
        install_location
    );

    // --- 3b. Lang ---
    if steps.write_lang_registry {
        let lang = read_launcher_lang_code();
        registry::registry_lang(&win_reg.hklm_software_path, &lang)
            .map_err(|e| format!("registry_lang: {e}"))?;
        crate::log_debug!("zip.post_install registry Lang={lang}");
    }

    // --- 3c. gclid（来自环境变量，与安装器一致） ---
    if steps.write_gclid_from_env {
        if let Ok(gclid) = std::env::var("GCLID") {
            if !gclid.is_empty() {
                registry::registry_gclid_value(&win_reg.hklm_software_path, &gclid)
                    .map_err(|e| format!("registry_gclid: {e}"))?;
                crate::log_debug!("zip.post_install registry gclid written");
            }
        }
    }

    // --- 3d. SlintRendererName（可选，与 ui_event.ts 一致） ---
    if let Some(ref renderer) = steps.slint_renderer_name {
        let name = renderer.trim();
        if !name.is_empty() {
            registry::registry_slint_renderer_name(&win_reg.hklm_software_path, name)
                .map_err(|e| format!("registry_slint_renderer_name: {e}"))?;
            crate::log_debug!("zip.post_install registry SlintRendererName={name}");
        }
    }

    // --- 4. 防火墙 ---
    let install_root = install_dir.to_path_buf();
    let max_con = steps.firewall_max_concurrent.max(1) as usize;
    let rule_prefix = win_reg.uninstall_subkey.clone();
    match add_firewall_rules(&install_root, max_con, &rule_prefix).await {
        Ok(res) => {
            crate::log_info!(
                "zip.post_install firewall rules_ok={} rules_failed={}",
                res.success_exes.len(),
                res.failed_exes.len()
            );
            if !res.success {
                for f in &res.failed_exes {
                    crate::log_warn!(
                        "zip.post_install firewall_failed direction={} path={}",
                        f.direction,
                        f.path.display()
                    );
                }
            }
        }
        Err(e) => crate::log_warn!("zip.post_install firewall err: {e}"),
    }

    crate::log_info!("zip.post_install completed install_dir={install_location}");
    Ok(())
}
