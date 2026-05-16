'use client'

import { useCallback, useRef, useState } from 'react'

import { downloadToolStream } from '@/cmd/tools'

import type { ToolManifest } from '@/config/tools-manifest'

import { DownloadPhase } from '@/enums/download-phase'

export function useToolDownload() {
  const [phase, setPhase] = useState<DownloadPhase>(DownloadPhase.Idle)
  const [receivedBytes, setReceivedBytes] = useState(0)
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const reset = useCallback(() => {
    setPhase(DownloadPhase.Idle)
    setReceivedBytes(0)
    setSavedPath(null)
    setError(null)
  }, [])

  const start = useCallback(async (tool: ToolManifest) => {
    if (inFlight.current) return
    inFlight.current = true

    setPhase(DownloadPhase.Downloading)
    setReceivedBytes(0)
    setSavedPath(null)
    setError(null)

    try {
      const path = await downloadToolStream({
        downloadSpec: tool.downloadSpec,
        relativeDir: tool.id,
        onChunkBytes: (n) => {
          setReceivedBytes((b) => b + n)
        }
      })
      setSavedPath(path)
      setPhase(DownloadPhase.Completed)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPhase(DownloadPhase.Error)
    } finally {
      inFlight.current = false
    }
  }, [])

  return { phase, receivedBytes, savedPath, error, start, reset }
}
