import { Channel } from '@tauri-apps/api/core'

import { invokeWrapper } from '@/cmd'
import type { PlatformDownloadSpec, ToolManifest } from '@/config/tools-manifest'

export async function getToolsDownloadDir() {
  return await invokeWrapper<string>('get_tools_download_dir')
}

export async function getToolsManifest() {
  return await invokeWrapper<ToolManifest[]>('get_tools_manifest')
}

export async function getRuntimeHostPlatform() {
  return await invokeWrapper<'windows' | 'macos'>('runtime_host_platform')
}

export async function getToolExecutablePath(toolId: string) {
  return await invokeWrapper<string>('get_tool_executable_path', { toolId })
}

export async function openToolExecutable(toolId: string) {
  return await invokeWrapper<void>('open_tool_executable', { toolId })
}

export async function downloadToolStream(args: {
  downloadSpec: PlatformDownloadSpec
  relativeDir: string
  onChunkBytes: (n: number) => void
}) {
  const channel = new Channel<number>()
  channel.onmessage = (n) => {
    args.onChunkBytes(n)
  }

  return await invokeWrapper<string>('download_tool', {
    downloadSpec: args.downloadSpec,
    relativeDir: args.relativeDir,
    onProgress: channel
  })
}
