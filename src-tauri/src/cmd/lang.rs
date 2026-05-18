use std::fs;

use directories::ProjectDirs;
use tauri::{path::BaseDirectory, Manager};

use crate::utils::log::trace_result_fn;

fn lang_store_path() -> Result<std::path::PathBuf, String> {
    ProjectDirs::from("com", "polymerization", "tauri-app")
        .ok_or_else(|| "cannot resolve project dirs".to_string())
        .map(|p| p.data_local_dir().join("app_lang.txt"))
}

fn normalize_lang_code(language: &str) -> &'static str {
    match language.trim() {
        "en" => "en",
        "cn" => "cn",
        _ => "cn",
    }
}

#[tauri::command]
pub async fn get_lang() -> String {
    let code = match lang_store_path() {
        Ok(path) => match fs::read_to_string(&path) {
            Ok(s) => {
                let s = s.trim();
                if matches!(s, "cn" | "en") {
                    s.to_string()
                } else {
                    "cn".to_string()
                }
            }
            Err(_) => "cn".to_string(),
        },
        Err(_) => "cn".to_string(),
    };
    crate::log_info!("cmd.lang.get_lang ok lang={code}");
    code
}

#[tauri::command]
pub async fn set_lang(lang: String) -> Result<(), String> {
    trace_result_fn("cmd.lang", "set_lang", || {
        if !matches!(lang.as_str(), "cn" | "en") {
            return Err(format!("unsupported language: {lang}"));
        }
        let path = lang_store_path()?;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&path, &lang).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub async fn get_language_resource_bundle(
    handle: tauri::AppHandle,
    language: String,
) -> Result<serde_json::Value, String> {
    trace_result_fn("cmd.lang", "get_language_resource_bundle", || {
        let code = normalize_lang_code(&language);
        let resource_path = handle
            .path()
            .resolve(
                format!("resources/languages/{code}.json"),
                BaseDirectory::Resource,
            )
            .map_err(|e| e.to_string())?;

        let file = fs::File::open(&resource_path).map_err(|e| e.to_string())?;
        let bundle: serde_json::Value = serde_json::from_reader(file).map_err(|e| e.to_string())?;
        Ok(bundle)
    })
}
