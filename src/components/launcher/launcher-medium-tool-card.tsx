"use client";

import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  LauncherToolCard,
  type LauncherToolCardProps,
  ToolGlyph,
} from "./launcher-tool-card";

export type LauncherMediumToolCardProps = Omit<
  LauncherToolCardProps,
  "isFeatured" | "isCompact" | "renderBody"
>;

/** 中卡：下载逻辑在 `LauncherToolCard`，排版仅在本组件。 */
export default function LauncherMediumToolCard({
  className,
  ...props
}: LauncherMediumToolCardProps) {
  return (
    <LauncherToolCard
      isFeatured={false}
      isCompact={false}
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
          <div className="flex min-h-0 gap-2.5">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm leading-tight tracking-tight sm:text-base">
                {title}
              </h3>
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-snug sm:line-clamp-3 sm:text-[0.8125rem]">
                {description}
              </p>
            </div>
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-sm h-full",
                iconGrad,
              )}
            >
              <ToolGlyph toolId={tool.id} />
            </div>
          </div>
        </>
      )}
    />
  );
}
