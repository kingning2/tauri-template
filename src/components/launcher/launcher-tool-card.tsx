"use client";

import {
  Download,
  FolderOpen,
  History,
  MapPin,
  MessagesSquare,
  Music2,
  Smartphone,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShadowCard } from "@/components/ui/shadow-card";
import {
  toolHasUniversalDownloadForPlatform,
  toolIdToI18nKey,
  type HostDesktopPlatform,
  type ToolManifest,
} from "@/config/tools-manifest";
import { ToolVariant } from "@/enums/tool-variant";
import { DownloadPhase } from "@/enums/download-phase";
import { useToolDownload } from "@/hooks/useToolDownload";
import { cn } from "@/lib/utils";

const TOOL_ICON: Partial<Record<string, LucideIcon>> = {
  "system-repair": Wrench,
  "phone-unlock": Smartphone,
  "virtual-location": MapPin,
  "data-transfer": FolderOpen,
  "data-recovery": History,
  "social-transfer": MessagesSquare,
  ringtone: Music2,
};

const TOOL_ICON_BOX: Partial<Record<string, string>> = {
  "system-repair": "from-sky-400 to-blue-600",
  "phone-unlock": "from-sky-400 to-blue-600",
  "virtual-location": "from-cyan-400 to-blue-600",
  "data-transfer": "from-blue-400 to-indigo-600",
  "data-recovery": "from-pink-400 to-rose-500",
  "social-transfer": "from-emerald-400 to-teal-600",
  ringtone: "from-violet-500 to-purple-600",
};

interface LauncherToolCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tool: ToolManifest;
  /** 来自 `runtime_host_platform`；未就绪前为 `null`，不显示为可下载。 */
  hostPlatform: HostDesktopPlatform | null;
}

function ToolGlyph({ toolId }: { toolId: string }) {
  const Icon = TOOL_ICON[toolId] ?? Wrench;
  return <Icon className="size-6 text-white sm:size-7" aria-hidden />;
}

export default function LauncherToolCard({
  tool,
  hostPlatform,
  className = "",
  children,
}: LauncherToolCardProps) {
  const { t } = useTranslation("tools");
  const { t: tc } = useTranslation("common");
  const key = toolIdToI18nKey(tool.id);
  const title = t(`${key}.title`);
  const description = t(`${key}.description`);
  const variant = tool.variant;

  const { phase, receivedBytes, error, start } = useToolDownload();

  const canDownload =
    hostPlatform != null &&
    toolHasUniversalDownloadForPlatform(tool.downloadSpec, hostPlatform);

  const busy = phase === DownloadPhase.Downloading;
  const done = phase === DownloadPhase.Completed;
  const failed = phase === DownloadPhase.Error;

  const progressValue = busy
    ? Math.min(92, 8 + Math.log10(receivedBytes + 10) * 18)
    : done
      ? 100
      : 0;

  const iconGrad = TOOL_ICON_BOX[tool.id] ?? "from-sky-400 to-blue-600";
  const isFeatured = variant === ToolVariant.HeroLeft;
  const isCompact = variant === ToolVariant.Small;

  const interactive = canDownload && !busy;

  return (
    <ShadowCard
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={() => {
        if (!interactive || !hostPlatform) return;
        void start(tool, hostPlatform);
      }}
      onKeyDown={(e) => {
        if (!interactive || !hostPlatform) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void start(tool, hostPlatform);
        }
      }}
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        interactive && "cursor-pointer",
        !interactive && "cursor-default opacity-95",
        isFeatured &&
          "h-full border-sky-100/80 bg-linear-to-b from-card to-sky-50/50",
        busy && "pointer-events-none opacity-90",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 p-3 sm:p-4",
          isCompact && "gap-1.5 p-2.5 sm:p-3",
        )}
      >
        <div className="flex min-h-0 gap-2.5 sm:gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-sm sm:size-12",
              iconGrad,
              isCompact && "size-9 rounded-lg sm:size-10",
            )}
          >
            <ToolGlyph toolId={tool.id} />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "font-semibold leading-tight tracking-tight",
                isFeatured ? "text-base sm:text-lg" : "text-sm sm:text-base",
                isCompact && "text-xs sm:text-sm",
              )}
            >
              {title}
            </h3>
            <p
              className={cn(
                "text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-snug sm:line-clamp-3 sm:text-[0.8125rem]",
                isCompact && "line-clamp-2 text-[0.6875rem]",
              )}
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-auto flex min-h-0 flex-col gap-1.5 pt-0.5">
          {!canDownload && (
            <Badge variant="secondary" className="w-fit text-xs font-normal">
              {tc("not_yet_online")}
            </Badge>
          )}
          {canDownload && busy && (
            <Progress value={progressValue} className="h-1.5" aria-label={tc("downloading")} />
          )}
          {canDownload && done && (
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Download className="size-3.5 shrink-0" aria-hidden />
              {tc("downloaded")}
            </span>
          )}
          {canDownload && failed && error && (
            <span className="text-destructive text-xs leading-snug">{error}</span>
          )}
        </div>
      </div>
      {children}
    </ShadowCard>
  );
}
