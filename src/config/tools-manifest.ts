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

export type PlatformDownloadSpec = {
  windows?: PlatformArtifacts
  macos?: PlatformArtifacts
  windowsProductRegistry?: WindowsProductRegistry
  macosInstalledBundlePath?: string
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
