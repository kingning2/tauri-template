//! 启动器工具清单（单一数据源，由前端通过 Tauri command 拉取）。
//!
//! 清单正文在仓库文件 **`resources/tools_manifest.json`**（与 `Cargo.toml` 同级的 `src-tauri/resources/`），
//! 编译时嵌入二进制；修改或新增工具只需编辑该 JSON 后重新构建。
//!
//! 字段与 [`ToolManifestEntry`] / [`crate::utils::platform::download::PlatformDownloadSpec`] 一致（camelCase）。

use std::sync::OnceLock;

use serde::{Deserialize, Serialize};

use crate::utils::platform::download::PlatformDownloadSpec;

const TOOLS_MANIFEST_JSON: &str =
    include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/resources/tools_manifest.json"));

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolManifestEntry {
    pub id: String,
    pub download_spec: PlatformDownloadSpec,
    #[serde(default)]
    pub hot: bool,
    pub variant: crate::utils::platform::download::ToolVariant,
}

fn load_tools_manifest() -> Vec<ToolManifestEntry> {
    serde_json::from_str(TOOLS_MANIFEST_JSON).unwrap_or_else(|e| {
        panic!(
            "failed to parse resources/tools_manifest.json: {e}\n\
             Fix the JSON schema (camelCase keys, kind: \"executable\"|\"zip\", variant: \"hero-left\"|\"medium\"|\"small\", optional windowsZipInstallSteps)."
        )
    })
}

static TOOLS_MANIFEST_CACHE: OnceLock<Vec<ToolManifestEntry>> = OnceLock::new();

/// 工具清单切片（进程内单例，首次访问时解析 JSON）。
pub fn tools_manifest() -> &'static [ToolManifestEntry] {
    TOOLS_MANIFEST_CACHE
        .get_or_init(load_tools_manifest)
        .as_slice()
}

#[test]
fn tools_manifest_json_parses() {
    let list: Vec<ToolManifestEntry> =
        serde_json::from_str(TOOLS_MANIFEST_JSON).expect("resources/tools_manifest.json");
    assert!(!list.is_empty());
}
