'use client'

import {
  Download,
  FolderOpen,
  History,
  MapPin,
  MessagesSquare,
  Music2,
  Smartphone,
  Wrench,
  type LucideIcon
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
import { toolIdToI18nKey, type ToolManifest } from '@/config/tools-manifest'
import { useToolDownload } from '@/hooks/useToolDownload'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/utils/format'

const TOOL_ICON: Partial<Record<string, LucideIcon>> = {
  'system-repair': Wrench,
  'phone-unlock': Smartphone,
  'virtual-location': MapPin,
  'data-transfer': FolderOpen,
  'data-recovery': History,
  'social-transfer': MessagesSquare,
  ringtone: Music2
}

const TOOL_ICON_BOX: Partial<Record<string, string>> = {
  'system-repair': 'from-sky-400 to-blue-600',
  'phone-unlock': 'from-sky-400 to-blue-600',
  'virtual-location': 'from-cyan-400 to-blue-600',
  'data-transfer': 'from-blue-400 to-indigo-600',
  'data-recovery': 'from-pink-400 to-rose-500',
  'social-transfer': 'from-emerald-400 to-teal-600',
  ringtone: 'from-violet-500 to-purple-600'
}

function ToolGlyph({ toolId }: { toolId: string }) {
  const Icon = TOOL_ICON[toolId] ?? Wrench
  return <Icon className="size-6 text-white sm:size-7" aria-hidden />
}

export default function LauncherToolCard({
  tool,
  className = ''
}: {
  tool: ToolManifest
  className?: string
}) {
  const { t } = useTranslation('tools')
  const { t: tc } = useTranslation('common')
  const key = toolIdToI18nKey(tool.id)
  const title = t(`${key}.title`)
  const description = t(`${key}.description`)
  const variant = tool.variant

  const { phase, receivedBytes, savedPath, error, start } = useToolDownload()

  const busy = phase === 'downloading'
  const done = phase === 'completed'
  const failed = phase === 'error'

  const progressValue =
    busy ? Math.min(92, 8 + Math.log10(receivedBytes + 10) * 18) : done ? 100 : 0

  const iconGrad = TOOL_ICON_BOX[tool.id] ?? 'from-sky-400 to-blue-600'
  const isFeatured = variant === 'hero-left'
  const isCompact = variant === 'small'

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
        'relative cursor-pointer overflow-hidden transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isFeatured && 'flex h-full min-h-0 flex-col border-sky-100/80 bg-linear-to-b from-card to-sky-50/50',
        busy && 'pointer-events-none opacity-90',
        className
      )}
    >
      {tool.hot ? (
        <Badge
          variant="destructive"
          className={cn(
            'absolute z-10 px-1.5 py-0.5 text-[10px] font-bold uppercase',
            isFeatured ? 'left-4 top-4' : 'left-3 top-3'
          )}
        >
          {tc('hot')}
        </Badge>
      ) : null}

      <CardHeader
        className={cn(
          isFeatured && 'shrink-0 space-y-3 pb-2 pt-6',
          variant === 'medium' && 'space-y-2 pb-2 pt-5',
          isCompact && 'space-y-1.5 p-3 pb-2 pt-4'
        )}
      >
        <div
          className={cn(
            'flex items-start justify-between gap-2',
            isFeatured && 'mb-1'
          )}
        >
          <div
            className={cn(
              'flex shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-inner',
              iconGrad,
              isFeatured && 'size-16 rounded-2xl sm:size-[72px]',
              variant === 'medium' && 'size-12 rounded-xl',
              isCompact && 'size-10 rounded-lg'
            )}
          >
            {isFeatured ? (
              <Wrench className="size-8 text-white sm:size-9" aria-hidden />
            ) : (
              <ToolGlyph toolId={tool.id} />
            )}
          </div>
          {tool.id === 'phone-unlock' && variant === 'medium' ? (
            <Badge
              variant="outline"
              className="gap-1 rounded-full border-sky-200 bg-sky-50 text-sky-700"
            >
              <Download className="size-3.5" aria-hidden />
            </Badge>
          ) : null}
        </div>
        <CardTitle
          className={cn(
            'leading-snug',
            isFeatured && 'text-lg sm:text-xl',
            variant === 'medium' && 'text-base',
            isCompact && 'text-sm font-semibold'
          )}
        >
          {title}
        </CardTitle>
        <CardDescription
          className={cn(
            'leading-relaxed',
            isFeatured && 'line-clamp-3 text-sm sm:line-clamp-4',
            variant === 'medium' && 'line-clamp-3 text-sm',
            isCompact && 'line-clamp-2 text-xs'
          )}
        >
          {description}
        </CardDescription>
      </CardHeader>

      {isFeatured ? (
        <div
          className="flex min-h-0 flex-1 items-center justify-center px-4 py-2"
          aria-hidden
        >
          <div className="flex items-end justify-center gap-2 opacity-90">
            <div className="h-20 w-10 rounded-md border border-sky-200/80 bg-card/90 shadow sm:h-24 sm:w-11" />
            <div className="h-[5.5rem] w-11 rounded-md border border-sky-300/90 bg-card shadow-md sm:h-28 sm:w-12" />
            <div className="h-20 w-10 rounded-md border border-sky-200/80 bg-card/90 shadow sm:h-24 sm:w-11" />
          </div>
        </div>
      ) : null}

      <CardContent
        className={cn(
          'space-y-2',
          isFeatured && 'shrink-0 pb-2 pt-0',
          variant === 'medium' && 'pb-2',
          isCompact && 'space-y-1 p-3 pb-2 pt-0'
        )}
      >
        {busy ? (
          <>
            <Progress value={progressValue} className="h-1.5" />
            <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
              {tc('downloading')} {formatBytes(receivedBytes)}
            </p>
          </>
        ) : null}
        <div className="flex min-h-[20px] flex-wrap items-center gap-2">
          {done ? (
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200"
            >
              {tc('downloaded')}
            </Badge>
          ) : null}
          {failed ? (
            <Badge variant="destructive" title={error ?? ''}>
              {tc('failed')}
            </Badge>
          ) : null}
        </div>
        {savedPath && done ? (
          <p
            className="truncate text-[11px] text-muted-foreground"
            title={savedPath}
          >
            {savedPath}
          </p>
        ) : null}
      </CardContent>

      <CardFooter
        className={cn(
          'shrink-0',
          isFeatured && 'border-t border-border/40 bg-card/50 pt-3',
          isCompact && 'p-3 pt-0'
        )}
      >
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={cn('w-full', isCompact && 'h-8 text-xs')}
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation()
            void start(tool)
          }}
        >
          {busy ? tc('downloading') : done ? tc('redownload') : tc('download')}
        </Button>
      </CardFooter>
    </Card>
  )
}
