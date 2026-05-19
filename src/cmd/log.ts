import { invoke } from "@tauri-apps/api/core";

import { isTauriRuntime } from "./invoke";

async function writeFeLog(
  cmd: "log_fe" | "log_fe_req",
  event: "info" | "error" | "warn",
  msg: string,
  consoleOutput: boolean
) {
  if (consoleOutput) {
    console.log(`[${event.toUpperCase()}] ${msg}`);
  }

  if (!isTauriRuntime()) {
    return;
  }

  return invoke(cmd, { event, msg });
}

export async function log(
  event: "info" | "error" | "warn",
  msg: string,
  consoleOutput: boolean = false
) {
  return writeFeLog("log_fe", event, msg, consoleOutput);
}

export async function log_req(
  event: "info" | "error" | "warn",
  msg: string,
  consoleOutput: boolean = false
) {
  return writeFeLog("log_fe_req", event, msg, consoleOutput);
}
