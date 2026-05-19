/**
 * 工具清单 IPC 类型由 Rust `typeshare` 生成；辅助函数保留在此。
 */
export type {
  DownloadArtifact,
  DownloadPayloadKind,
  HostDesktopPlatform,
  OpenToolExecutableArgs,
  PlatformArtifacts,
  PlatformDownloadSpec,
  ToolInstallState,
  ToolManifestEntry,
  ToolVariant,
  WindowsProductRegistry,
  WindowsZipInstallSteps
} from "@/generated/contracts";

/** 与 Rust `ToolManifestEntry` 同名别名，供业务层使用。 */
export type { ToolManifestEntry as ToolManifest } from "@/generated/contracts";

import {
  HostDesktopPlatform,
  type DownloadArtifact,
  type OpenToolExecutableArgs,
  type PlatformDownloadSpec
} from "@/generated/contracts";

function artifactHasDownloadSource(artifact: DownloadArtifact | undefined): boolean {
  if (!artifact) return false;
  const url = artifact.url?.trim() ?? "";
  const key = artifact.downloadKey?.trim() ?? "";
  return Boolean(url || key);
}

/** 当前平台是否配置了可下载源（`url` 或 `downloadKey`，任一架构槽位即可）。 */
export function toolHasDownloadForPlatform(
  spec: PlatformDownloadSpec,
  platform: HostDesktopPlatform
): boolean {
  const arts = platform === HostDesktopPlatform.Windows ? spec.windows : spec.macos;
  if (!arts) return false;
  return (
    artifactHasDownloadSource(arts.universal) ||
    artifactHasDownloadSource(arts.x64) ||
    artifactHasDownloadSource(arts.arm64)
  );
}

/** @deprecated 使用 `toolHasDownloadForPlatform` */
export const toolHasUniversalDownloadForPlatform = toolHasDownloadForPlatform;

/** i18n key suffix under namespace `tools`, e.g. system_repair -> tools:system_repair.title */
export function toolIdToI18nKey(id: string): string {
  return id.replace(/-/g, "_");
}

/** 从 `downloadSpec` 构造打开工具所需参数（Windows：`InstallPath` + 相对主程序名）。 */
export function openToolArgsFromDownloadSpec(spec: PlatformDownloadSpec): OpenToolExecutableArgs {
  return {
    windowsHklmSoftwarePath: spec.windowsProductRegistry?.hklmSoftwarePath,
    windowsZipMainExecutableRelative: spec.windowsZipInstallSteps?.mainExecutableRelative,
    windowsMainExecutableRelative: spec.windowsMainExecutableRelative,
    macosInstalledBundlePath: spec.macosInstalledBundlePath
  };
}
