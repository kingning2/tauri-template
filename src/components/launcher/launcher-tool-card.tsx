"use client";

import {
  FolderOpen,
  History,
  MapPin,
  MessagesSquare,
  Music2,
  Smartphone,
  Wrench,
  type LucideIcon
} from "lucide-react";
import { useTranslation } from "react-i18next";

import DowloadCard, { type DowloadCardRenderArgs } from "@/components/dowload/dowload-card";
import {
  toolIdToI18nKey,
  type HostDesktopPlatform,
  type ToolInstallState,
  type ToolManifest
} from "@/config/tools-manifest";

const TOOL_ICON: Partial<Record<string, LucideIcon>> = {
  "system-repair": Wrench,
  "phone-unlock": Smartphone,
  "virtual-location": MapPin,
  "data-transfer": FolderOpen,
  "data-recovery": History,
  "social-transfer": MessagesSquare,
  ringtone: Music2
};

const TOOL_ICON_BOX: Partial<Record<string, string>> = {
  "system-repair": "from-sky-400 to-blue-600",
  "phone-unlock": "from-sky-400 to-blue-600",
  "virtual-location": "from-cyan-400 to-blue-600",
  "data-transfer": "from-blue-400 to-indigo-600",
  "data-recovery": "from-pink-400 to-rose-500",
  "social-transfer": "from-emerald-400 to-teal-600",
  ringtone: "from-violet-500 to-purple-600"
};

function toolLauncherIconGradient(toolId: string): string {
  return TOOL_ICON_BOX[toolId] ?? "from-sky-400 to-blue-600";
}

export function ToolGlyph({ toolId }: { toolId: string }) {
  const Icon = TOOL_ICON[toolId] ?? Wrench;
  return <Icon className="size-6 text-white sm:size-7" aria-hidden />;
}

export type LauncherToolCardBodyRenderProps = DowloadCardRenderArgs & {
  title: string;
  description: string;
  iconGrad: string;
  tool: ToolManifest;
  toolInstallState?: ToolInstallState;
  tc: (key: string) => string;
};

export interface LauncherToolCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  tool: ToolManifest;
  isFeatured: boolean;
  isCompact: boolean;
  /** 来自 `runtime_host_platform`；未就绪前为 `null`，不显示为可下载。 */
  hostPlatform: HostDesktopPlatform | null;
  /** 来自 `get_tools_install_state`；首屏加载后由父组件注入。 */
  toolInstallState?: ToolInstallState;
  /** 下载完成后刷新安装态（与 `get_tools_install_state` 一致）。 */
  onInstallStateRefresh?: () => void;
  renderBody: (props: LauncherToolCardBodyRenderProps) => React.ReactNode;
  /** 与原先 `ShadowCard` 内层之后的插槽一致（如卡片扩展区） */
  trailing?: React.ReactNode;
}

/** 连接 `DowloadCard`、i18n 文案与下载态；具体排版由大/中/小卡片各自 `renderBody` 实现。 */
export function LauncherToolCard({
  tool,
  isFeatured,
  isCompact,
  hostPlatform,
  toolInstallState,
  onInstallStateRefresh,
  className = "",
  renderBody,
  trailing,
  ...rest
}: LauncherToolCardProps) {
  const { t } = useTranslation("tools");
  const { t: tc } = useTranslation("common");
  const key = toolIdToI18nKey(tool.id);
  const title = t(`${key}.title`);
  const description = t(`${key}.description`);
  const iconGrad = toolLauncherIconGradient(tool.id);

  return (
    <DowloadCard
      {...rest}
      tool={tool}
      hostPlatform={hostPlatform}
      onInstallStateRefresh={onInstallStateRefresh}
      title={title}
      isFeatured={isFeatured}
      isCompact={isCompact}
      iconGradient={iconGrad}
      className={className}
      trailing={trailing}
      toolInstallState={toolInstallState}
    >
      {(args) =>
        renderBody({
          ...args,
          title,
          description,
          iconGrad,
          tool,
          toolInstallState,
          tc
        })
      }
    </DowloadCard>
  );
}
