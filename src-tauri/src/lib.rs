mod cmd;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::async_runtime::block_on(async {
        if let Err(e) = utils::log::init_log().await {
            eprintln!("failed to init log: {}", e);
        }
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            cmd::tools::download_tool,
            cmd::tools::get_tools_download_dir,
            cmd::log::log_fe,
            cmd::log::log_fe_req,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
