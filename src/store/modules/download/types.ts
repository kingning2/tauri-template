import { DownloadPhase, type ToolDownloadEntry } from "@/generated/contracts";

export type { DownloadPhase, ToolDownloadEntry };

export type DownloadState = {
  byToolId: Record<string, ToolDownloadEntry>;
};

export const createIdleDownloadEntry = (): ToolDownloadEntry => ({
  phase: DownloadPhase.Idle,
  downloadedBytes: 0,
  totalBytes: undefined,
  savedPath: undefined,
  error: undefined,
  inFlight: false
});
