use std::path::PathBuf;

use crate::utils::platform::open_tool::OpenToolExecutableArgs;

/// 从注册表 `InstallPath` 与相对主程序名解析待打开的可执行路径。
pub fn resolve_executable_path(args: &OpenToolExecutableArgs) -> Result<PathBuf, String> {
    let Some(hklm) = args.windows_hklm_software_path.as_deref() else {
        return Err("windowsHklmSoftwarePath is required on Windows".to_string());
    };
    super::tool_launch::resolve_executable_from_registry(
        hklm,
        args.windows_zip_main_executable_relative.as_deref(),
        args.windows_main_executable_relative.as_deref(),
    )
}
