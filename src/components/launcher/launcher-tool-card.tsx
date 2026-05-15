'use client'

import { Download } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { ToolManifest } from '@/config/tools-manifest'
import { useToolDownload } from '@/hooks/useToolDownload'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/utils/format'

export default function LauncherToolCard({
  tool,
  className = ''
}: {
  tool: ToolManifest
  className?: string
}) {
  const { phase, receivedBytes, savedPath, error, start } = useToolDownload()

  const busy = phase === 'downloading'
  const done = phase === 'completed'
  const failed = phase === 'error'

  const progressValue =
    busy ? Math.min(92, 8 + Math.log10(receivedBytes + 10) * 18) : done ? 100 : 0

  return (
    <Card
      role="button"
      tabIndex={busy ? -1 : 0}
      onClick={() => {
        if (!busy) void start(tool)
      }}
      onKeyDown={(e) => {
        if (busy) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          void start(tool)
        }
      }}
      className={cn(
        'relative cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        busy && 'pointer-events-none opacity-90',
        className
      )}
    >
      {tool.hot ? (
        <Badge
          variant="destructive"
          className="absolute left-4 top-4 px-1.5 py-0.5 text-[10px] font-bold uppercase"
        >
          HOT
        </Badge>
      ) : null}

      <CardHeader className="pb-2">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div
            className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-xl text-white shadow-inner"
            aria-hidden
          >
            {tool.id === 'phone-unlock' ? '🔓' : '◆'}
          </div>
          {tool.id === 'phone-unlock' ? (
            <Badge variant="outline" className="gap-1 rounded-full border-sky-200 bg-sky-50 text-sky-700">
              <Download className="size-3.5" aria-hidden />
            </Badge>
          ) : null}
        </div>
        <CardTitle className="text-base leading-snug">{tool.title}</CardTitle>
        <CardDescription className="line-clamp-3 text-sm leading-relaxed">
          {tool.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2 pb-2">
        {busy ? (
          <>
            <Progress value={progressValue} className="h-1.5" />
            <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
              下載中… {formatBytes(receivedBytes)}
            </p>
          </>
        ) : null}
        <div className="flex min-h-[22px] flex-wrap items-center gap-2">
          {done ? (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200">
              已下載
            </Badge>
          ) : null}
          {failed ? (
            <Badge variant="destructive" title={error ?? ''}>
              失敗
            </Badge>
          ) : null}
        </div>
        {savedPath && done ? (
          <p className="truncate text-[11px] text-muted-foreground" title={savedPath}>
            {savedPath}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="w-full"
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation()
            void start(tool)
          }}
        >
          {busy ? '下載中…' : done ? '重新下載' : '下載'}
        </Button>
      </CardFooter>
    </Card>
  )
}
