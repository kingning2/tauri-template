import { ToolVariant } from "@/enums/tool-variant";

/**
 * 与后端 `src-tauri/resources/tools_manifest.json` 字段对齐（camelCase）。
 * 清单数据在 Rust 侧解析并下发，此处仅保留 TypeScript 类型。
 */

export type DownloadPayloadKind = "zip" | "executable";

export type DownloadArtifact = {
  /** 直接下载地址；与 `downloadKey` 二选一 */
  url?: string;
  /** 解析 API 的 name 参数：`GET {downloadResolveBaseUrl}?name={downloadKey}` */
  downloadKey?: string;
  /** 本地保存文件名；未填时由后端从 url 路径推导 */
  fileName?: string;
  kind: DownloadPayloadKind;
};

export type PlatformArtifacts = {
  universal?: DownloadArtifact;
  x64?: DownloadArtifact;
  arm64?: DownloadArtifact;
};

/** 与 Rust `WindowsProductRegistry` 一致；按产品配置，勿写死单一 Unlock。 */
export type WindowsProductRegistry = {
  /** 如 `SOFTWARE\\Gbyte\\Unlock` */
  hklmSoftwarePath: string;
  /** Uninstall 子键名，如 `gbyte_unlock` */
  uninstallSubkey: string;
};

/** Windows zip 解压后：注册表、语言/gclid/slint、防火墙（与 `windowsProductRegistry` 同时配置才执行；无快捷方式）。 */
export type WindowsZipInstallSteps = {
  mainExecutableRelative: string;
  uninstallerRelative: string;
  displayName: string;
  publisher: string;
  displayVersion: string;
  /** 并发添加防火墙规则的 PowerShell 任务上限，默认 8（与安装器一致）。兼容旧键 `firewallScanMaxExes`。 */
  firewallMaxConcurrent?: number;
  /** @deprecated 使用 `firewallMaxConcurrent` */
  firewallScanMaxExes?: number;
  slintRendererName?: string;
  writeLangRegistry?: boolean;
  writeGclidFromEnv?: boolean;
};

export type HostDesktopPlatform = "windows" | "macos";

export type PlatformDownloadSpec = {
  windows?: PlatformArtifacts;
  macos?: PlatformArtifacts;
  windowsProductRegistry?: WindowsProductRegistry;
  /** 相对 HKLM `InstallPath`（安装目录）的主程序文件名，如 `Gbyte Unlock.exe`；与 zip 的 `windowsZipInstallSteps.mainExecutableRelative` 二选一，同时存在时以 zip 为准。 */
  windowsMainExecutableRelative?: string;
  macosInstalledBundlePath?: string;
  windowsZipInstallSteps?: WindowsZipInstallSteps;
  /** 使用 `downloadKey` 时的解析 API 地址（`GET ?name=`），默认见后端 `.env` */
  downloadResolveBaseUrl?: string;
};

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
  const arts = platform === "windows" ? spec.windows : spec.macos;
  if (!arts) return false;
  return (
    artifactHasDownloadSource(arts.universal) ||
    artifactHasDownloadSource(arts.x64) ||
    artifactHasDownloadSource(arts.arm64)
  );
}

/** @deprecated 使用 `toolHasDownloadForPlatform` */
export const toolHasUniversalDownloadForPlatform = toolHasDownloadForPlatform;

export type ToolManifest = {
  id: string;
  downloadSpec: PlatformDownloadSpec;
  hot?: boolean;
  variant: ToolVariant;
};

/** 与 Rust `ToolInstallState` 对齐（`get_tools_install_state`）。 */
export type ToolInstallState = {
  toolId: string;
  installed: boolean;
  executablePath?: string;
  installCheckError?: string;
};

/** 与 Rust `OpenToolExecutableArgs` 对齐（`open_tool_executable`）；由注册表 / bundle 解析路径，不经由 `toolId` 查嵌入清单。 */
export type OpenToolExecutableArgs = {
  windowsHklmSoftwarePath?: string;
  windowsZipMainExecutableRelative?: string;
  windowsMainExecutableRelative?: string;
  macosInstalledBundlePath?: string;
};

/** 从 `downloadSpec` 构造打开工具所需参数（Windows：`InstallPath` + 相对主程序名）。 */
export function openToolArgsFromDownloadSpec(spec: PlatformDownloadSpec): OpenToolExecutableArgs {
  return {
    windowsHklmSoftwarePath: spec.windowsProductRegistry?.hklmSoftwarePath,
    windowsZipMainExecutableRelative: spec.windowsZipInstallSteps?.mainExecutableRelative,
    windowsMainExecutableRelative: spec.windowsMainExecutableRelative,
    macosInstalledBundlePath: spec.macosInstalledBundlePath
  };
}

/** i18n key suffix under namespace `tools`, e.g. system_repair -> tools:system_repair.title */
export function toolIdToI18nKey(id: string): string {
  return id.replace(/-/g, "_");
}
