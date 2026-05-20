import { DownloadPhase } from "@/generated/contracts";

import type { ToolDownloadEntry } from "./types";

export function formatDownloadPercentLabel(p: number): string {
  if (p <= 0) return "0";
  if (p >= 100) return "100";
  const x = Math.round(p * 100) / 100;
  if (Number.isInteger(x)) return String(x);
  return x.toFixed(2).replace(/\.?0+$/, "");
}

export function selectProgressPercent(entry: ToolDownloadEntry): number | null {
  const { downloadedBytes, totalBytes } = entry;
  if (totalBytes != null && totalBytes > 0) {
    return Math.min(100, (downloadedBytes / totalBytes) * 100);
  }
  return null;
}

export function selectProgressBarValue(entry: ToolDownloadEntry): number | null {
  const progressPercent = selectProgressPercent(entry);
  if (progressPercent != null) return progressPercent;
  if (entry.phase !== DownloadPhase.Downloading) return null;
  return entry.downloadedBytes > 0 ? null : 0;
}

export function selectProgressLabel(entry: ToolDownloadEntry): string | null {
  const progressPercent = selectProgressPercent(entry);
  if (progressPercent != null) {
    return formatDownloadPercentLabel(progressPercent);
  }
  if (entry.phase !== DownloadPhase.Downloading) return null;
  return entry.downloadedBytes > 0 ? null : "0";
}
