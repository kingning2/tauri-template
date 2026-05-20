import { FE_LOG_EVENT, FE_LOG_REQ_EVENT, type FeLogPayload } from "@/config/window-events";
import { isTauriRuntime } from "./invoke";
import { tauriEmit } from "@/utils/tauri-event";

async function writeFeLog(
  eventName: typeof FE_LOG_EVENT | typeof FE_LOG_REQ_EVENT,
  level: FeLogPayload["level"],
  msg: string,
  consoleOutput: boolean
) {
  if (consoleOutput) {
    console.log(`[${level.toUpperCase()}] ${msg}`);
  }

  if (!isTauriRuntime()) {
    return;
  }

  const payload: FeLogPayload = { level, msg };
  await tauriEmit(eventName, payload);
}

export async function log(
  event: FeLogPayload["level"],
  msg: string,
  consoleOutput: boolean = false
) {
  return writeFeLog(FE_LOG_EVENT, event, msg, consoleOutput);
}

export async function log_req(
  event: FeLogPayload["level"],
  msg: string,
  consoleOutput: boolean = false
) {
  return writeFeLog(FE_LOG_REQ_EVENT, event, msg, consoleOutput);
}
