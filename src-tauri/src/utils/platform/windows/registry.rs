//! Windows 注册表读写。
//!
//! 所有「产品数据」路径均通过参数 `hklm_software_path` 传入（形如 `SOFTWARE\Gbyte\Unlock`），
//! 不得在模块内写死为单一产品。
#![allow(dead_code)]

use std::path::PathBuf;

use winreg::enums::{HKEY_LOCAL_MACHINE, KEY_WOW64_64KEY, KEY_WRITE};
use winreg::RegKey;

const REGISTRY_INSTALL_ROOT: &str = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall";

const REGISTRY_DATA_SLINT_RENDERER_NAME: &str = "SlintRendererName";
const REGISTRY_DATA_LANG_KEY: &str = "Lang";
const REGISTRY_DATA_INSTALL_PATH_KEY: &str = "InstallPath";
const REGISTRY_DATA_GCLID_KEY: &str = "gclid";

pub struct RegistryInstallValue {
    pub install_location: String,
    pub uninstall_string: String,
    pub display_version: String,
    pub display_name: String,
    pub publisher: String,
    pub uninstall_registry_subkey: String,
    pub shortcut_path: Option<String>,
}

/// 注册表安装
pub fn registry_install(value: RegistryInstallValue) -> Result<(), String> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);

    let registry_base = PathBuf::from(REGISTRY_INSTALL_ROOT).join(&value.uninstall_registry_subkey);

    let (key, _disp) = hklm
        .create_subkey_with_flags(registry_base, KEY_WRITE | KEY_WOW64_64KEY)
        .map_err(|e| e.to_string())?;

    key.set_value("DisplayName", &value.display_name)
        .map_err(|e| format!("set DisplayName err: {e:?}"))?;

    key.set_value("UninstallString", &value.uninstall_string)
        .map_err(|e| format!("set UninstallString err: {e:?}"))?;

    key.set_value("DisplayIcon", &value.uninstall_string)
        .map_err(|e| format!("set DisplayIcon err: {e:?}"))?;

    key.set_value("Publisher", &value.publisher)
        .map_err(|e| format!("set Publisher err: {e:?}"))?;

    key.set_value("InstallLocation", &value.install_location)
        .map_err(|e| format!("set InstallLocation err: {e:?}"))?;

    key.set_value("DisplayVersion", &value.display_version)
        .map_err(|e| format!("set DisplayVersion err: {e:?}"))?;

    if let Some(shortcut_path) = value.shortcut_path {
        let _ = key.set_value("ShortcutPath", &shortcut_path);
    }

    Ok(())
}

/// 判断工具是否已安装
pub fn registry_install_exist(subkey: &str) -> bool {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let registry_base = PathBuf::from(REGISTRY_INSTALL_ROOT).join(subkey);
    hklm.open_subkey(registry_base).is_ok()
}

/// 获取语言字符串
pub fn get_lang_string(hklm_software_path: &str) -> Result<String, String> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let key = hklm
        .open_subkey(hklm_software_path.trim_start_matches('\\'))
        .map_err(|e| e.to_string())?;
    key.get_value(REGISTRY_DATA_LANG_KEY)
        .map_err(|e| format!("get {REGISTRY_DATA_LANG_KEY} err: {e:?}"))
}

/// 注册表设置语言字符串
pub fn registry_lang(hklm_software_path: &str, lang: &str) -> Result<(), String> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let (key, _disp) = hklm
        .create_subkey_with_flags(hklm_software_path.trim_start_matches('\\'), KEY_WRITE | KEY_WOW64_64KEY)
        .map_err(|e| e.to_string())?;
    key.set_value(REGISTRY_DATA_LANG_KEY, &lang)
        .map_err(|e| format!("set {REGISTRY_DATA_LANG_KEY} err: {e:?}"))
}

/// 获取安装路径
pub fn get_install_path(hklm_software_path: &str) -> Result<PathBuf, String> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let key = hklm
        .open_subkey(hklm_software_path.trim_start_matches('\\'))
        .map_err(|e| e.to_string())?;
    let value: String = key
        .get_value(REGISTRY_DATA_INSTALL_PATH_KEY)
        .map_err(|e| format!("get {REGISTRY_DATA_INSTALL_PATH_KEY} err: {e:?}"))?;
    Ok(PathBuf::from(value))
}

/// 注册表设置安装路径
pub fn registry_install_path(hklm_software_path: &str, install_path: String) -> Result<(), String> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let (key, _disp) = hklm
        .create_subkey_with_flags(hklm_software_path.trim_start_matches('\\'), KEY_WRITE | KEY_WOW64_64KEY)
        .map_err(|e| e.to_string())?;
    key.set_value(REGISTRY_DATA_INSTALL_PATH_KEY, &install_path)
        .map_err(|e| format!("set {REGISTRY_DATA_INSTALL_PATH_KEY} err: {e:?}"))
}

/// 获取 gclid
pub fn get_gclid(hklm_software_path: &str) -> Result<String, String> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let key = hklm
        .open_subkey(hklm_software_path.trim_start_matches('\\'))
        .map_err(|e| e.to_string())?;
    key.get_value(REGISTRY_DATA_GCLID_KEY)
        .map_err(|e| format!("get {REGISTRY_DATA_GCLID_KEY} err: {e:?}"))
}

/// 注册表设置 gclid
pub fn registry_gclid_value(hklm_software_path: &str, gclid: &str) -> Result<(), String> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let (key, _disp) = hklm
        .create_subkey_with_flags(hklm_software_path.trim_start_matches('\\'), KEY_WRITE | KEY_WOW64_64KEY)
        .map_err(|e| e.to_string())?;
    key.set_value(REGISTRY_DATA_GCLID_KEY, &gclid)
        .map_err(|e| format!("set gclid err: {e:?}"))
}
