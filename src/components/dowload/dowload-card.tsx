"use client";

import type { ReactNode } from "react";
import { useDownloadBadgeAnimation } from "@/animation";
import { ShadowCard } from "@/components/ui/shadow-card";
import { openToolExecutable } from "@/cmd/tools";
import {
  openToolArgsFromDownloadSpec,
  toolHasDownloadForPlatform,
  ToolInstallState,
  type HostDesktopPlatform,
  type ToolManifest
} from "@/config/tools-manifest";
import { DownloadPhase } from "@/enums/download-phase";
import { useToolDownload } from "@/hooks/useToolDownload";
import { cn } from "@/lib/utils";
import DowloadProgress from "./dowload-progress";

export interface DowloadCardRenderArgs {
  canDownload: boolean;
  busy: boolean;
  done: boolean;
  failed: boolean;
  error: string | null;
  interactive: boolean;
  startDownload: () => void;
}

export interface DowloadCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  tool: ToolManifest;
  hostPlatform: HostDesktopPlatform | null;
  onInstallStateRefresh?: () => void;
  title: string;
  isFeatured: boolean;
  isCompact: boolean;
  iconGradient: string;
  children: (args: DowloadCardRenderArgs) => ReactNode;
  trailing?: ReactNode;
  toolInstallState?: ToolInstallState;
}

export default function DowloadCard({
  tool,
  toolInstallState,
  hostPlatform,
  onInstallStateRefresh,
  isCompact,
  children,
  className,
  ...shadowCardProps
}: DowloadCardProps) {
  const { phase, error, start, reset, progressBarValue } = useToolDownload(tool.id);

  const {
    cardSurfaceRef,
    badgeMotionRef,
    badgeVisualRef,
    setCardHovered,
    downloadExpandActive,
    progressExpanded,
    playDownloadExpand,
    handleDownloadFinishDismiss
  } = useDownloadBadgeAnimation({
    phase,
    onCollapseComplete: reset
  });

  const canDownload =
    hostPlatform != null && toolHasDownloadForPlatform(tool.downloadSpec, hostPlatform);

  const busy = phase === DownloadPhase.Downloading;
  const done = phase === DownloadPhase.Completed;
  const failed = phase === DownloadPhase.Error;
  const interactive = canDownload && !busy;

  const runDownload = () => {
    if (!hostPlatform) return;
    void start(tool, hostPlatform, {
      onCompleted: onInstallStateRefresh
    });
  };

  const requestDownload = () => {
    if (!interactive || !hostPlatform) return;
    playDownloadExpand(runDownload);
  };

  const renderArgs: DowloadCardRenderArgs = {
    canDownload,
    busy,
    done,
    failed,
    error,
    interactive,
    startDownload: requestDownload
  };

  const overlayExpanded = downloadExpandActive || progressExpanded;

  return (
    <div
      className={cn("relative h-full min-h-0", className)}
      onPointerEnter={() => setCardHovered(true)}
      onPointerLeave={() => setCardHovered(false)}
    >
      <ShadowCard
        ref={cardSurfaceRef}
        {...shadowCardProps}
        role={interactive ? "button" : shadowCardProps.role}
        tabIndex={interactive ? 0 : shadowCardProps.tabIndex}
        onClick={() => {
          if (!toolInstallState?.installed) {
            requestDownload();
            return;
          }
          void openToolExecutable(openToolArgsFromDownloadSpec(tool.downloadSpec));
        }}
        className={cn(
          "relative flex h-full min-h-0 flex-col overflow-hidden",
          canDownload && "cursor-pointer"
        )}
      >
        {children(renderArgs)}
        {canDownload && (
          <div
            ref={badgeMotionRef}
            aria-hidden
            className={cn(
              "pointer-events-none absolute z-20 will-change-transform",
              overlayExpanded && "overflow-hidden rounded-3xl",
              progressExpanded ? "inset-0 h-full w-full" : "top-[20px] right-[20px] h-10 w-10"
            )}
          >
            <div
              ref={badgeVisualRef}
              className={cn(
                "h-full w-full",
                overlayExpanded
                  ? "overflow-hidden rounded-3xl bg-[#0a84ff]/55 ring-1 ring-white/25 backdrop-blur-md ring-inset"
                  : "rounded-full bg-[#0a84ff] p-0.5"
              )}
            >
              <DowloadProgress
                phase={phase}
                progress={progressBarValue}
                installed={!!toolInstallState?.installed}
                layoutExpanded={overlayExpanded}
                onFinishDismiss={handleDownloadFinishDismiss}
              />
            </div>
          </div>
        )}
      </ShadowCard>
    </div>
  );
}
