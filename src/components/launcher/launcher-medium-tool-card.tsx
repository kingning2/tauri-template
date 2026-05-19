"use client";

import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { LauncherToolCard, type LauncherToolCardProps, ToolGlyph } from "./launcher-tool-card";

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
      renderBody={({ title, description, iconGrad, tool }) => (
        <div className={cn("flex h-full min-h-0 flex-col gap-2 p-6")}>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm leading-tight font-semibold tracking-tight sm:text-base">
              {title}
            </h3>
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-snug sm:line-clamp-3 sm:text-[0.8125rem]">
              {description}
            </p>
          </div>
          <div
            className={cn(
              "flex size-24 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-sm",
              iconGrad,
              "ml-auto"
            )}
          >
            <ToolGlyph toolId={tool.id} />
          </div>
        </div>
      )}
    />
  );
}
