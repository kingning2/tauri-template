import { DownloadPhase, type ToolDownloadEntry } from "@/generated/contracts";

export type { DownloadPhase, ToolDownloadEntry };

export type DownloadState = {
  byToolId: Record<string, ToolDownloadEntry>;
};

/** 无下载记录时的稳定占位，供 selector 复用，避免每次返回新对象引用。 */
export const IDLE_DOWNLOAD_ENTRY: ToolDownloadEntry = {
  phase: DownloadPhase.Idle,
  downloadedBytes: 0,
  totalBytes: undefined,
  savedPath: undefined,
  error: undefined,
  inFlight: false
};

export const createIdleDownloadEntry = (): ToolDownloadEntry => IDLE_DOWNLOAD_ENTRY;
