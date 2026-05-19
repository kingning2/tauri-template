//! 导出 IPC 契约 JSON Schema（供构建校验与文档）。
//!
//! ```bash
//! cargo run --manifest-path src-tauri/Cargo.toml --bin export-contract-schemas
//! ```

use std::fs;
use std::path::PathBuf;

use schemars::schema_for;
use tauri_app_lib::contracts::ToolManifestEntry;

fn main() {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let schema_dir = root.join("../schemas");
    fs::create_dir_all(&schema_dir).expect("create schemas dir");

    let schema = schema_for!(Vec<ToolManifestEntry>);
    let json = serde_json::to_string_pretty(&schema).expect("serialize schema");
    let out = schema_dir.join("tools_manifest.schema.json");
    fs::write(&out, json).expect("write tools_manifest.schema.json");
    eprintln!("wrote {}", out.display());
}
