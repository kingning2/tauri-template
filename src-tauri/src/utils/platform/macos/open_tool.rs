use std::path::PathBuf;

use crate::utils::platform::open_tool::OpenToolExecutableArgs;

/// 从 bundle 路径解析待打开的 `.app` 路径。
pub fn resolve_executable_path(args: &OpenToolExecutableArgs) -> Result<PathBuf, String> {
    let Some(bundle) = args.macos_installed_bundle_path.as_deref() else {
        return Err("macosInstalledBundlePath is required on macOS".to_string());
    };
    super::tool_launch::resolve_installed_bundle_path(bundle)
}
