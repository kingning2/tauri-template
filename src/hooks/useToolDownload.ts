"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { downloadToolStream, type ToolDownloadProgress } from "@/cmd/tools";
import {
  toolHasDownloadForPlatform,
  type HostDesktopPlatform,
  type ToolManifest
} from "@/config/tools-manifest";

import { DownloadPhase } from "@/enums/download-phase";

function formatDownloadPercentLabel(p: number): string {
  if (p <= 0) return "0";
  if (p >= 100) return "100";
  const x = Math.round(p * 100) / 100;
  if (Number.isInteger(x)) return String(x);
  return x.toFixed(2).replace(/\.?0+$/, "");
}

export function useToolDownload() {
  const [phase, setPhase] = useState<DownloadPhase>(DownloadPhase.Idle);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState<number | null>(null);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const applyProgress = useCallback((p: ToolDownloadProgress) => {
    setDownloadedBytes(p.downloaded);
    if (p.total != null) {
      setTotalBytes(p.total);
    }
  }, []);

  const reset = useCallback(() => {
    setPhase(DownloadPhase.Idle);
    setDownloadedBytes(0);
    setTotalBytes(null);
    setSavedPath(null);
    setError(null);
  }, []);

  const start = useCallback(
    async (
      tool: ToolManifest,
      hostPlatform: HostDesktopPlatform,
      options?: { onCompleted?: () => void }
    ) => {
      if (!toolHasDownloadForPlatform(tool.downloadSpec, hostPlatform)) {
        return;
      }
      if (inFlight.current) return;
      inFlight.current = true;

      setPhase(DownloadPhase.Downloading);
      setDownloadedBytes(0);
      setTotalBytes(null);
      setSavedPath(null);
      setError(null);

      try {
        const path = await downloadToolStream({
          downloadSpec: tool.downloadSpec,
          relativeDir: tool.id,
          onProgress: applyProgress
        });
        setSavedPath(path);
        setPhase(DownloadPhase.Completed);
        options?.onCompleted?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setPhase(DownloadPhase.Error);
      } finally {
        inFlight.current = false;
      }
    },
    [applyProgress]
  );

  /** 已知总大小时为 0–100；未知时为 `null`（与 `DowloadProgress` 的 indeterminate 一致） */
  const progressPercent = useMemo(() => {
    if (totalBytes != null && totalBytes > 0) {
      return Math.min(100, (downloadedBytes / totalBytes) * 100);
    }
    return null;
  }, [downloadedBytes, totalBytes]);

  /** 用于条形/环形：有百分比用百分比；下载中且未知总量且已有字节则为 `null`；否则为 `0` */
  const progressBarValue = useMemo((): number | null => {
    if (progressPercent != null) return progressPercent;
    if (phase !== DownloadPhase.Downloading) return null;
    return downloadedBytes > 0 ? null : 0;
  }, [progressPercent, phase, downloadedBytes]);

  /** 展示用百分比文案；未知总量且已收到数据时为 `null` */
  const progressLabel = useMemo((): string | null => {
    if (progressPercent != null) {
      return formatDownloadPercentLabel(progressPercent);
    }
    if (phase !== DownloadPhase.Downloading) return null;
    return downloadedBytes > 0 ? null : "0";
  }, [progressPercent, phase, downloadedBytes]);

  return {
    phase,
    downloadedBytes,
    totalBytes,
    savedPath,
    error,
    start,
    reset,
    progressPercent,
    progressBarValue,
    progressLabel
  };
}
