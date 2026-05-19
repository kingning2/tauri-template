"use client";

import { useCallback, useMemo } from "react";

import { downloadToolStream } from "@/cmd/tools";
import {
  toolHasDownloadForPlatform,
  type HostDesktopPlatform,
  type ToolManifest
} from "@/config/tools-manifest";
import { DownloadPhase } from "@/enums/download-phase";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  downloadCompleted,
  downloadFailed,
  downloadProgressUpdated,
  downloadReset,
  downloadStarted
} from "@/store/modules/download";
import { createIdleDownloadEntry } from "@/store/modules/download/types";
import {
  selectProgressBarValue,
  selectProgressLabel,
  selectProgressPercent
} from "@/store/modules/download/selectors";

export function useToolDownload(toolId: string) {
  const dispatch = useAppDispatch();
  const entry = useAppSelector(
    (state) => state.download.byToolId[toolId] ?? createIdleDownloadEntry()
  );
  const inFlight = useAppSelector((state) => state.download.byToolId[toolId]?.inFlight ?? false);

  const reset = useCallback(() => {
    dispatch(downloadReset({ toolId }));
  }, [dispatch, toolId]);

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

      dispatch(downloadStarted({ toolId }));

      try {
        const path = await downloadToolStream({
          downloadSpec: tool.downloadSpec,
          relativeDir: tool.id,
          onProgress: (p) => {
            dispatch(
              downloadProgressUpdated({
                toolId,
                downloaded: p.downloaded,
                total: p.total ?? undefined
              })
            );
          }
        });
        dispatch(downloadCompleted({ toolId, savedPath: path }));
        options?.onCompleted?.();
      } catch (e) {
        dispatch(
          downloadFailed({
            toolId,
            error: e instanceof Error ? e.message : String(e)
          })
        );
      }
    },
    [dispatch, inFlight, toolId]
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
