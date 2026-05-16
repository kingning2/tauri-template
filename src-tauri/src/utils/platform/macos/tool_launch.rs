use std::path::PathBuf;

use crate::config::tools_manifest::ToolManifestEntry;

pub fn resolve_tool_launch_path(entry: &ToolManifestEntry) -> Result<PathBuf, String> {
    let spec = &entry.download_spec;
    let Some(ref bundle) = spec.macos_installed_bundle_path else {
        return Err("tool has no macosInstalledBundlePath".to_string());
    };
    let p = PathBuf::from(bundle);
    if p.exists() {
        return Ok(p);
    }
    Err(format!("bundle not found: {bundle}"))
}
