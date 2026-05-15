use std::{path::PathBuf, sync::OnceLock};

use tokio::{
    fs::{create_dir_all, File, OpenOptions},
    io::AsyncWriteExt,
    sync::Mutex,
};

use crate::utils::date;

#[macro_export]
macro_rules! log_error { ($($arg:tt)+) => { $crate::utils::log::log("ERROR", &format!($($arg)+)) }; }

#[macro_export]
macro_rules! log_warn  { ($($arg:tt)+) => { $crate::utils::log::log("WARN",  &format!($($arg)+)) }; }

#[macro_export]
macro_rules! log_info  { ($($arg:tt)+) => { $crate::utils::log::log("INFO",  &format!($($arg)+)) }; }

#[macro_export]
macro_rules! log_debug { ($($arg:tt)+) => { $crate::utils::log::log("DEBUG", &format!($($arg)+)) }; }

static LOG_FILE: OnceLock<Mutex<File>> = OnceLock::new();

async fn generated_log(log_path: &PathBuf) -> Result<(), String> {
    if let Some(parent) = log_path.parent() {
        create_dir_all(parent).await.map_err(|e| e.to_string())?;
    }

    let log_file_path = format!(
        "{}.{}.log",
        log_path.to_string_lossy(),
        date::current_date_string()
    );

    let file = OpenOptions::new()
        .read(true)
        .write(true)
        .append(true)
        .create(true)
        .open(log_file_path)
        .await
        .map_err(|e| e.to_string())?;

    if LOG_FILE.get().is_none() {
        let _ = LOG_FILE.set(Mutex::new(file));
        log("INFO", "===== Successfully started the log service =====");
        return Ok(());
    }

    Ok(())
}

pub fn log(level: &str, msg: &str) {
    let datetime = date::current_datetime_string();
    let line = format!("[{}] [{}] {}\n\n", datetime, level, msg);

    print!("{}", line);

    tokio::spawn(async move {
        if let Some(file_mutex) = LOG_FILE.get() {
            let mut file = file_mutex.lock().await;
            let _ = file.write_all(line.as_bytes()).await;
        }
    });
}

pub async fn init_log() -> Result<(), String> {
    let dirs = directories::ProjectDirs::from("com", "polymerization", "gybte")
        .ok_or_else(|| "could not resolve app log directory".to_string())?;

    let log_root = dirs.data_local_dir().join("logs");
    let log_path = log_root.join("tauri-app");

    generated_log(&log_path).await
}
