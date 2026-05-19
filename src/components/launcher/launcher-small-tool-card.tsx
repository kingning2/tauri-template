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
      renderBody={({ title, description, iconGrad, tool }) => (
        <div className="flex flex-col justify-center items-center text-center gap-2.5 sm:gap-3 h-full p-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br shadow-sm sm:size-10",
              iconGrad,
            )}
          >
            <ToolGlyph toolId={tool.id} />
          </div>
          <h3 className="font-semibold text-xs leading-tight tracking-tight sm:text-sm">
            {title}
          </h3>
          <p className="text-muted-foreground line-clamp-2 text-[0.6875rem] leading-snug">
            {description}
          </p>
        </div>
      )}
    />
  );
}
