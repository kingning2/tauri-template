"use client";

import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  LauncherToolCard,
  type LauncherToolCardProps,
  ToolGlyph,
} from "./launcher-tool-card";

export type LauncherSmallToolCardProps = Omit<
  LauncherToolCardProps,
  "isFeatured" | "isCompact" | "renderBody"
>;

/** 小卡：下载逻辑在 `LauncherToolCard`，排版仅在本组件。 */
export default function LauncherSmallToolCard({
  className,
  ...props
}: LauncherSmallToolCardProps) {
  return (
    <LauncherToolCard
      isFeatured={false}
      isCompact
      {...props}
      className={cn("min-h-0", className)}
      renderBody={({
        canDownload,
        done,
        failed,
        error,
        title,
        description,
        iconGrad,
        tool,
        toolInstallState,
        tc,
      }) => (
        <>
          <div className="flex min-h-0 gap-2.5 sm:gap-3">
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br shadow-sm sm:size-10",
                iconGrad,
              )}
            >
              <ToolGlyph toolId={tool.id} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-xs leading-tight tracking-tight sm:text-sm">
                {title}
              </h3>
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[0.6875rem] leading-snug">
                {description}
              </p>
            </div>
          </div>

          <div className="mt-auto flex min-h-0 flex-col gap-1.5 pt-0.5">
            {!canDownload && (
              <Badge
                variant="secondary"
                className="w-fit text-xs font-normal"
              >
                {tc("not_yet_online")}
              </Badge>
            )}
            {canDownload && toolInstallState?.installed && !done && (
              <Badge
                variant="outline"
                className="w-fit border-emerald-200/80 bg-emerald-50/80 text-xs font-normal text-emerald-900"
              >
                {tc("installed_on_device")}
              </Badge>
            )}
            {canDownload && done && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Download className="size-3.5 shrink-0" aria-hidden />
                {tc("downloaded")}
              </span>
            )}
            {canDownload && failed && error && (
              <span className="text-destructive text-xs leading-snug">
                {error}
              </span>
            )}
          </div>
        </>
      )}
    />
  );
}
