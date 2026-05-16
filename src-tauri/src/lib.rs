mod cmd;
mod config;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(e) = utils::log::init_log() {
        eprintln!("failed to init log: {}", e);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|_| {
            for tool in crate::config::tools_manifest::tools_manifest() {
                match crate::utils::platform::download::is_tool_download_installed(
                    &tool.download_spec,
                    &tool.id,
                ) {
                    Ok(installed) => {
                        crate::log_info!(
                            "startup.tools_install_state id={} installed={}",
                            tool.id,
                            installed
                        );
                    }
                    Err(e) => {
                        crate::log_warn!(
                            "startup.tools_install_state id={} err={}",
                            tool.id,
                            e
                        );
                    }
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            cmd::lang::get_lang,
            cmd::lang::set_lang,
            cmd::lang::get_language_resource_bundle,
            cmd::tools::download_tool,
            cmd::tools::get_tools_download_dir,
            cmd::tools::get_tools_manifest,
            cmd::tools::runtime_host_platform,
            cmd::tools::get_tool_executable_path,
            cmd::tools::open_tool_executable,
            cmd::log::log_fe,
            cmd::log::log_fe_req,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
