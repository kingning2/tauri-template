import { Channel } from '@tauri-apps/api/core'

import { invokeWrapper } from '@/cmd'

export async function getToolsDownloadDir() {
  return await invokeWrapper<string>('get_tools_download_dir')
}

export async function downloadToolStream(args: {
  url: string
  relativePath: string
  onChunkBytes: (n: number) => void
}) {
  const channel = new Channel<number>()
  channel.onmessage = (n) => {
    args.onChunkBytes(n)
  }

  return await invokeWrapper<string>('download_tool', {
    url: args.url,
    relativePath: args.relativePath,
    onProgress: channel
  })
}
