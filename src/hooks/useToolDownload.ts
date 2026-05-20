"use client";

import { useCallback, useMemo } from "react";

import { downloadToolStream, resetToolDownloadState } from "@/cmd/tools";
import {
  toolHasDownloadForPlatform,
  type HostDesktopPlatform,
  type ToolManifest
} from "@/config/tools-manifest";
import { useAppSelector } from "@/store/hooks";
import { createIdleDownloadEntry } from "@/store/modules/download/types";
import {
  selectProgressBarValue,
  selectProgressLabel,
  selectProgressPercent
} from "@/store/modules/download/selectors";

export function useToolDownload(toolId: string) {
  const entry = useAppSelector(
    (state) => state.download.byToolId[toolId] ?? createIdleDownloadEntry()
  );
  const inFlight = useAppSelector((state) => state.download.byToolId[toolId]?.inFlight ?? false);

  const reset = useCallback(() => {
    void resetToolDownloadState(toolId);
  }, [toolId]);

  const start = useCallback(
    async (
      tool: ToolManifest,
      hostPlatform: HostDesktopPlatform,
      options?: { onCompleted?: () => void }
    ) => {
      if (tool.id !== toolId) return;
      if (!toolHasDownloadForPlatform(tool.downloadSpec, hostPlatform)) {
        return;
      }
      if (inFlight) return;

      try {
        await downloadToolStream({
          toolId,
          downloadSpec: tool.downloadSpec,
          relativeDir: tool.id,
          onProgress: () => {
            /* 进度由 Rust 写入共享态并 `tools/download/changed` 广播，各窗 Redux 同步 */
          }
        });
        options?.onCompleted?.();
      } catch {
        /* 失败态由 Rust 广播 */
      }
    },
    [inFlight, toolId]
  );

  const progressPercent = useMemo(() => selectProgressPercent(entry), [entry]);
  const progressBarValue = useMemo(() => selectProgressBarValue(entry), [entry]);
  const progressLabel = useMemo(() => selectProgressLabel(entry), [entry]);

  return {
    phase: entry.phase,
    downloadedBytes: entry.downloadedBytes,
    totalBytes: entry.totalBytes,
    savedPath: entry.savedPath,
    error: entry.error,
    start,
    reset,
    progressPercent,
    progressBarValue,
    progressLabel
  };
}
