import { DownloadPhase } from "@/enums/download-phase";

export type ToolDownloadEntry = {
  phase: DownloadPhase;
  downloadedBytes: number;
  totalBytes: number | null;
  savedPath: string | null;
  error: string | null;
  inFlight: boolean;
};

export type DownloadState = {
  byToolId: Record<string, ToolDownloadEntry>;
};

export const createIdleDownloadEntry = (): ToolDownloadEntry => ({
  phase: DownloadPhase.Idle,
  downloadedBytes: 0,
  totalBytes: null,
  savedPath: null,
  error: null,
  inFlight: false
});
