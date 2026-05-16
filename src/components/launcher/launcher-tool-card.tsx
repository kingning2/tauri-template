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
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShadowCard } from "@/components/ui/shadow-card";
import { toolIdToI18nKey, type ToolManifest } from "@/config/tools-manifest";
import { ToolVariant } from "@/enums/tool-variant";
import { useToolDownload } from "@/hooks/useToolDownload";
import { DownloadPhase } from "@/enums/download-phase";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/utils/format";
import { Children } from "react";

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

interface ToolGlyphProps extends React.HTMLAttributes<HTMLDivElement> {
  tool: ToolManifest;
}

function ToolGlyph({ toolId }: { toolId: string }) {
  const Icon = TOOL_ICON[toolId] ?? Wrench;
  return <Icon className="size-6 text-white sm:size-7" aria-hidden />;
}

export default function LauncherToolCard({
  tool,
  className = "",
  children,
}: ToolGlyphProps) {
  const { t } = useTranslation("tools");
  const { t: tc } = useTranslation("common");
  const key = toolIdToI18nKey(tool.id);
  const title = t(`${key}.title`);
  const description = t(`${key}.description`);
  const variant = tool.variant;

  const { phase, receivedBytes, savedPath, error, start } = useToolDownload();

  const busy = phase === DownloadPhase.Downloading;
  const done = phase === DownloadPhase.Completed;

  const progressValue = busy
    ? Math.min(92, 8 + Math.log10(receivedBytes + 10) * 18)
    : done
      ? 100
      : 0;

  const iconGrad = TOOL_ICON_BOX[tool.id] ?? "from-sky-400 to-blue-600";
  const isFeatured = variant === ToolVariant.HeroLeft;
  const isCompact = variant === ToolVariant.Small;

  return (
    <ShadowCard
      role="button"
      tabIndex={busy ? -1 : 0}
      onClick={() => {
        if (!busy) void start(tool);
      }}
      onKeyDown={(e) => {
        if (busy) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void start(tool);
        }
      }}
      className={cn(
        "cursor-pointer",
        isFeatured &&
          "flex h-full min-h-0 flex-col border-sky-100/80 bg-linear-to-b from-card to-sky-50/50",
        busy && "pointer-events-none opacity-90",
        className,
      )}
    >
      {children}
    </ShadowCard>
  );
}
