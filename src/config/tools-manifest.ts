import { ToolVariant } from '@/enums/tool-variant'

/**
 * 与后端 `src-tauri/resources/tools_manifest.json` 字段对齐（camelCase）。
 * 清单数据在 Rust 侧解析并下发，此处仅保留 TypeScript 类型。
 */

export type DownloadPayloadKind = 'zip' | 'executable'

export type DownloadArtifact = {
  url: string
  fileName: string
  kind: DownloadPayloadKind
}

export type PlatformArtifacts = {
  universal?: DownloadArtifact
  x64?: DownloadArtifact
  arm64?: DownloadArtifact
}

/** 与 Rust `WindowsProductRegistry` 一致；按产品配置，勿写死单一 Unlock。 */
export type WindowsProductRegistry = {
  /** 如 `SOFTWARE\\Gbyte\\Unlock` */
  hklmSoftwarePath: string
  /** Uninstall 子键名，如 `gbyte_unlock` */
  uninstallSubkey: string
}

/** Windows zip 解压后：注册表、语言/gclid/slint、防火墙（与 `windowsProductRegistry` 同时配置才执行；无快捷方式）。 */
export type WindowsZipInstallSteps = {
  mainExecutableRelative: string
  uninstallerRelative: string
  displayName: string
  publisher: string
  displayVersion: string
  /** 并发添加防火墙规则的 PowerShell 任务上限，默认 8（与安装器一致）。兼容旧键 `firewallScanMaxExes`。 */
  firewallMaxConcurrent?: number
  /** @deprecated 使用 `firewallMaxConcurrent` */
  firewallScanMaxExes?: number
  slintRendererName?: string
  writeLangRegistry?: boolean
  writeGclidFromEnv?: boolean
}

export type HostDesktopPlatform = 'windows' | 'macos'

export type PlatformDownloadSpec = {
  windows?: PlatformArtifacts
  macos?: PlatformArtifacts
  windowsProductRegistry?: WindowsProductRegistry
  /** 相对 HKLM `InstallPath`（安装目录）的主程序文件名，如 `Gbyte Unlock.exe`；与 zip 的 `windowsZipInstallSteps.mainExecutableRelative` 二选一，同时存在时以 zip 为准。 */
  windowsMainExecutableRelative?: string
  macosInstalledBundlePath?: string
  windowsZipInstallSteps?: WindowsZipInstallSteps
}

/** 当前平台是否存在 `universal` 且含有效 `url` / `fileName`（可下载）；否则界面应显示暂未上线。 */
export function toolHasUniversalDownloadForPlatform(
  spec: PlatformDownloadSpec,
  platform: HostDesktopPlatform
): boolean {
  const arts = platform === 'windows' ? spec.windows : spec.macos
  const u = arts?.universal
  const url = u?.url?.trim() ?? ''
  const fileName = u?.fileName?.trim() ?? ''
  return Boolean(url && fileName)
}

export type ToolManifest = {
  id: string
  downloadSpec: PlatformDownloadSpec
  hot?: boolean
  variant: ToolVariant
}

/** i18n key suffix under namespace `tools`, e.g. system_repair -> tools:system_repair.title */
export function toolIdToI18nKey(id: string): string {
  return id.replace(/-/g, '_')
}
