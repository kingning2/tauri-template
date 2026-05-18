"use client";

import { cn } from "@/lib/utils";

import {
  LauncherToolCard,
  type LauncherToolCardProps,
  ToolGlyph,
} from "./launcher-tool-card";

export type LauncherLargeToolCardProps = Omit<
  LauncherToolCardProps,
  "isFeatured" | "isCompact" | "renderBody"
>;

/** 大卡：下载逻辑在 `LauncherToolCard`，排版仅在本组件。 */
export default function LauncherLargeToolCard({
  className,
  ...props
}: LauncherLargeToolCardProps) {
  return (
    <LauncherToolCard
      isFeatured
      isCompact={false}
      {...props}
      className={cn("min-h-0", className)}
      renderBody={({
        title,
        description,
        iconGrad,
        tool,
      }) => (
        <>
          <div className="flex min-h-0 sm:gap-3 flex-col items-center text-center gap-4 justify-center h-full">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-sm sm:size-12",
                iconGrad,
              )}
            >
              <ToolGlyph toolId={tool.id} />
            </div>
            <h3 className="font-semibold text-base leading-tight tracking-tight sm:text-lg">
              {title}
            </h3>
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-snug sm:line-clamp-3 sm:text-[0.8125rem]">
              {description}
            </p>
          </div>
        </>
      )}
    />
  );
}
