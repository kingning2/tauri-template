//! 与 `unlock-next-app` 安装器 `system::add_firewall_rules` 一致：`glob` 枚举安装目录下所有 `.exe`，
//! 用 PowerShell `New-NetFirewallRule` 为每个 exe 添加入站 + 出站允许规则；`Semaphore` 限制并发。

use std::path::PathBuf;
use std::sync::Arc;

use futures_util::stream::FuturesUnordered;
use futures_util::StreamExt;
use glob::glob;
use tokio::process::Command;
use tokio::sync::Semaphore;

#[derive(Debug)]
pub struct FirewallFailedItem {
    pub direction: String,
    pub path: PathBuf,
}

#[derive(Debug)]
pub struct FirewallResult {
    pub success: bool,
    pub success_exes: Vec<PathBuf>,
    pub failed_exes: Vec<FirewallFailedItem>,
}

/// 为 `root_path` 下（递归）每个 `.exe` 添加入站 + 出站防火墙规则。
///
/// - `max_concurrent`：同时执行的 PowerShell 任务上限（与安装器 `add_firewall_rules(..., 8)` 一致）。
/// - `rule_display_prefix`：规则显示名前缀，例如卸载子键 `gbyte_unlock` → `gbyte_unlock.Inbound:foo.exe`。
pub async fn add_firewall_rules(
    root_path: &PathBuf,
    max_concurrent: usize,
    rule_display_prefix: &str,
) -> Result<FirewallResult, String> {
    let max_concurrent = max_concurrent.max(1);
    let semaphore = Arc::new(Semaphore::new(max_concurrent));

    let mut success_exes = Vec::new();
    let mut failed_exes: Vec<FirewallFailedItem> = Vec::new();

    let prefix = rule_display_prefix.replace('"', "'");

    let pattern = format!(
        "{}/**/*.exe",
        root_path.to_string_lossy().replace('\\', "/")
    );

    let entries = glob(&pattern).map_err(|e| e.to_string())?;

    let mut tasks = FuturesUnordered::new();

    for entry in entries {
        let Ok(entry_path) = entry else {
            continue;
        };

        let exe_path = entry_path.to_string_lossy().to_string();
        let file_name = entry_path
            .file_name()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_else(|| "unknown.exe".to_string());

        let semaphore = semaphore.clone();
        let entry_clone = entry_path.clone();

        let in_display = format!("{prefix}.Inbound:{file_name}");
        let out_display = format!("{prefix}.Outbound:{file_name}");

        let ps_script = format!(
            r#"
                New-NetFirewallRule `
                  -DisplayName "{in_display}" `
                  -Description "Allow inbound traffic for {file}" `
                  -Program "{program}" `
                  -Direction Inbound `
                  -Action Allow `
                  -Profile Any

                New-NetFirewallRule `
                  -DisplayName "{out_display}" `
                  -Description "Allow outbound traffic for {file}" `
                  -Program "{program}" `
                  -Direction Outbound `
                  -Action Allow `
                  -Profile Any
                "#,
            in_display = in_display.replace('"', "'"),
            out_display = out_display.replace('"', "'"),
            file = file_name.replace('"', "'"),
            program = exe_path.replace('`', "'").replace('"', "'"),
        );

        let task = tokio::spawn(async move {
            let _permit = semaphore.acquire().await.unwrap();

            let mut cmd = Command::new("powershell");
            cmd.args([
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                &ps_script,
            ]);
            #[cfg(windows)]
            {
                cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
            }

            let status = cmd.status().await;

            match status {
                Ok(s) if s.success() => Ok(entry_clone),
                _ => Err(FirewallFailedItem {
                    direction: "both".to_string(),
                    path: entry_clone,
                }),
            }
        });

        tasks.push(task);
    }

    while let Some(handle) = tasks.next().await {
        match handle {
            Ok(Ok(path)) => success_exes.push(path),
            Ok(Err(fail)) => failed_exes.push(fail),
            Err(e) => crate::log_warn!("firewall.task_join_err: {e:?}"),
        }
    }

    Ok(FirewallResult {
        success: failed_exes.is_empty(),
        success_exes,
        failed_exes,
    })
}
