use std::fs;
use std::path::Path;

use chrono::Utc;

fn main() {
    /* ===== env ===== */
    // 可选：从仓库根 .env 注入 cargo:rustc-env=KEY=VALUE 给 Rust 代码使用
    // 如果 .env 不存在，则跳过，避免影响构建。
    let dotenv_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../.env");
    if dotenv_path.exists() {
        println!("cargo:rerun-if-changed={}", dotenv_path.display());

        if let Ok(contents) = fs::read_to_string(&dotenv_path) {
            for line in contents.lines() {
                let line = line.trim();
                if line.is_empty() || line.starts_with('#') {
                    continue;
                }

                if let Some((key, value)) = line.split_once('=') {
                    let key = key.trim();
                    if key.is_empty() {
                        continue;
                    }

                    let mut value = value.trim().to_string();
                    // 支持简单的引号包裹值
                    if (value.starts_with('"') && value.ends_with('"'))
                        || (value.starts_with('\'') && value.ends_with('\''))
                    {
                        value = value[1..value.len() - 1].to_string();
                    }

                    println!("cargo:rustc-env={}={}", key, value);
                }
            }
        }
    }

    // 版本号
    println!("cargo:rustc-env=APP_VERSION={}", env!("CARGO_PKG_VERSION"));

    // 用 UTC 日期生成 build number
    let now = Utc::now();
    let build_number = now.format("%Y%m%d%H%M%S").to_string();
    println!("cargo:rustc-env=APP_BUILD_NUMBER={}", build_number);

    // 同时也可以用作打包时间
    let last_update = now.format("%Y-%m-%d %H:%M:%S").to_string();
    println!("cargo:rustc-env=APP_LAST_UPDATE={}", last_update);

    /* ===== build ===== */
    tauri_build::build()
}
