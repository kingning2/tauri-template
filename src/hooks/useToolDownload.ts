'use client'

import { useCallback, useRef, useState } from 'react'

import { downloadToolStream } from '@/cmd/tools'

import type { ToolManifest } from '@/config/tools-manifest'

export type DownloadPhase = 'idle' | 'downloading' | 'completed' | 'error'

export function useToolDownload() {
  const [phase, setPhase] = useState<DownloadPhase>('idle')
  const [receivedBytes, setReceivedBytes] = useState(0)
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const reset = useCallback(() => {
    setPhase('idle')
    setReceivedBytes(0)
    setSavedPath(null)
    setError(null)
  }, [])

  const start = useCallback(async (tool: ToolManifest) => {
    if (inFlight.current) return
    inFlight.current = true

    setPhase('downloading')
    setReceivedBytes(0)
    setSavedPath(null)
    setError(null)

    const relativePath = `${tool.id}/${tool.fileName}`

    try {
      const path = await downloadToolStream({
        url: tool.downloadUrl,
        relativePath,
        onChunkBytes: (n) => {
          setReceivedBytes((b) => b + n)
        }
      })
      setSavedPath(path)
      setPhase('completed')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPhase('error')
    } finally {
      inFlight.current = false
    }
  }, [])

  return { phase, receivedBytes, savedPath, error, start, reset }
}
