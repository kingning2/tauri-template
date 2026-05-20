'use client'

import { Info, RefreshCw, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { toolLauncherIconGradient, ToolGlyph } from '@/components/launcher/launcher-tool-card'
import { useModalMotion } from '@/components/modal/modal-motion-provider'
import { Button } from '@/components/ui/button'
import { getRuntimeHostPlatform, getToolsInstallState, getToolsManifest, openToolExecutable } from '@/cmd/tools'
import {
  installStateByToolId,
  refreshToolsInstallStateAcrossWindows,
  useToolsInstallStateSync
} from '@/events/cross-webview-sync'
import {
  openToolArgsFromDownloadSpec,
  toolHasDownloadForPlatform,
  toolIdToI18nKey,
  type HostDesktopPlatform,
  type ToolInstallState,
  type ToolManifest
} from '@/config/tools-manifest'
import { DownloadPhase } from '@/generated/contracts'
import { useToolDownload } from '@/hooks/useToolDownload'
import { cn } from '@/lib/utils'

type HeaderMode = 'overview' | 'license'
type RowAction = 'open' | 'download' | 'buy'

function ActivateHeaderChrome({
  children,
  loading,
  onRefresh,
  onClose,
  closeLabel
}: {
  children: React.ReactNode
  loading: boolean
  onRefresh: () => void
  onClose: () => void
  closeLabel: string
}) {
  const { t } = useTranslation('modal_window')

  return (
    <header
      data-tauri-drag-region
      className="relative shrink-0 overflow-hidden border-b border-violet-100/80 bg-linear-to-br from-violet-50 via-indigo-50/90 to-sky-50 px-5 pt-4 pb-5"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <div className="absolute -top-6 right-8 size-24 rotate-12 rounded-lg bg-violet-200/50" />
        <div className="absolute top-10 right-24 size-16 -rotate-6 rounded-md bg-sky-200/40" />
        <div className="absolute right-40 bottom-2 size-20 rotate-45 rounded-lg bg-indigo-100/60" />
      </div>
      <div className="relative space-y-4 pr-20">
        {children}
        <div className="absolute top-0 right-0 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-slate-500 hover:bg-white/60 hover:text-slate-700"
            onClick={onRefresh}
            aria-label={t('activate_refresh')}
          >
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-slate-500 hover:bg-white/60 hover:text-slate-700"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

function resolveRowAction(installed: boolean, canDownload: boolean): RowAction {
  if (installed) return 'open'
  if (canDownload) return 'download'
  return 'buy'
}

function ActivateSpinner() {
  return (
    <div
      className="size-12 animate-spin rounded-full border-[3px] border-sky-200 border-t-sky-500"
      role="status"
      aria-hidden
    />
  )
}

function ActivateLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
      <ActivateSpinner />
      <p className="text-sm font-medium text-sky-600">{label}</p>
    </div>
  )
}

type ActivateProductRowProps = {
  tool: ToolManifest
  hostPlatform: HostDesktopPlatform | null
  installed: boolean
  title: string
  description: string
  iconGrad: string
  onInstallStateRefresh: () => void
}

function ActivateProductRow({
  tool,
  hostPlatform,
  installed,
  title,
  description,
  iconGrad,
  onInstallStateRefresh
}: ActivateProductRowProps) {
  const { t: tTitle } = useTranslation('title_bar')
  const { t: tCommon } = useTranslation('common')
  const { phase, start } = useToolDownload(tool.id)

  const canDownload =
    hostPlatform != null && toolHasDownloadForPlatform(tool.downloadSpec, hostPlatform)
  const action = resolveRowAction(installed, canDownload)
  const busy = phase === DownloadPhase.Downloading

  const actionLabel =
    action === 'open'
      ? tCommon('open')
      : action === 'download'
        ? busy
          ? tCommon('downloading')
          : tCommon('download')
        : tTitle('buy_now')

  const handleAction = () => {
    if (action === 'open') {
      void openToolExecutable(openToolArgsFromDownloadSpec(tool.downloadSpec))
      return
    }
    if (action === 'download') {
      if (!hostPlatform || busy) return
      void start(tool, hostPlatform, { onCompleted: onInstallStateRefresh })
    }
  }

  return (
    <li className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0">
      <div
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br shadow-sm',
          iconGrad
        )}
      >
        <ToolGlyph toolId={tool.id} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[0.9375rem] leading-snug font-semibold text-slate-800">{title}</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
      <Button
        type="button"
        size="sm"
        disabled={action === 'download' && busy}
        onClick={handleAction}
        className={cn(
          'h-8 shrink-0 rounded-full px-4 text-xs font-semibold text-white shadow-sm',
          action === 'buy' &&
            'bg-linear-to-r from-amber-400 to-yellow-300 hover:from-amber-500 hover:to-yellow-400',
          action === 'download' &&
            'bg-linear-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600',
          action === 'open' &&
            'bg-linear-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600'
        )}
      >
        {actionLabel}
      </Button>
    </li>
  )
}

export function ActivatePanel() {
  const { t } = useTranslation('modal_window')
  const { t: tTools } = useTranslation('tools')
  const { t: tTitle } = useTranslation('title_bar')
  const { requestClose } = useModalMotion()
  const [loading, setLoading] = useState(true)
  const [tools, setTools] = useState<ToolManifest[] | null>(null)
  const [hostPlatform, setHostPlatform] = useState<HostDesktopPlatform | null>(null)
  const [installByToolId, setInstallByToolId] = useState<Record<string, ToolInstallState>>({})
  const [headerMode, setHeaderMode] = useState<HeaderMode>('overview')
  const [licenseCode, setLicenseCode] = useState('')

  const refreshInstallState = useCallback(() => {
    void refreshToolsInstallStateAcrossWindows().then((list) => {
      setInstallByToolId(installStateByToolId(list))
    })
  }, [])

  useToolsInstallStateSync(setInstallByToolId)

  const fetchProducts = useCallback(async (options?: { showLoading?: boolean }) => {
    if (options?.showLoading) setLoading(true)
    try {
      const [list, installList, platform] = await Promise.all([
        getToolsManifest(),
        getToolsInstallState(),
        getRuntimeHostPlatform()
      ])
      setTools(list)
      setInstallByToolId(Object.fromEntries(installList.map((s) => [s.toolId, s])))
      setHostPlatform(platform)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [list, installList, platform] = await Promise.all([
          getToolsManifest(),
          getToolsInstallState(),
          getRuntimeHostPlatform()
        ])
        if (cancelled) return
        setTools(list)
        setInstallByToolId(Object.fromEntries(installList.map((s) => [s.toolId, s])))
        setHostPlatform(platform)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const onRefresh = useCallback(() => {
    void fetchProducts({ showLoading: true })
  }, [fetchProducts])

  const handleSubmitLicense = () => {
    const code = licenseCode.trim()
    if (!code) return
    // TODO: 接入授權碼啟用 command
  }

  return (
    <div className="modal-window flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <ActivateHeaderChrome
        loading={loading}
        onRefresh={onRefresh}
        onClose={() => requestClose()}
        closeLabel={tTitle('close')}
      >
        {headerMode === 'overview' ? (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1" data-tauri-drag-region>
              <h1 className="text-lg leading-tight font-bold tracking-tight text-slate-800">
                {t('activate_welcome_title', { app: tTitle('app_name') })}
              </h1>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-500">
                {t('activate_welcome_subtitle')}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 rounded-full bg-linear-to-r from-orange-400 to-pink-500 px-4 text-xs font-semibold text-white shadow-md hover:from-orange-500 hover:to-pink-600"
              onClick={() => setHeaderMode('license')}
            >
              {t('activate_enter_license')}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2" data-tauri-drag-region>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 px-2 text-xs text-slate-500 hover:text-slate-700"
                onClick={() => setHeaderMode('overview')}
              >
                {t('activate_back')}
              </Button>
              <h1 className="text-lg leading-tight font-bold tracking-tight text-slate-800">
                {t('activate_form_title', { app: tTitle('app_name') })}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={licenseCode}
                onChange={(e) => setLicenseCode(e.target.value)}
                placeholder={t('activate_license_placeholder')}
                className="border-border/80 focus:border-sky-400 focus:ring-sky-400/30 h-11 min-w-0 flex-1 rounded-full border bg-white px-4 text-sm text-slate-800 shadow-sm outline-none focus:ring-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmitLicense()
                }}
              />
              <Button
                type="button"
                size="sm"
                disabled={!licenseCode.trim()}
                onClick={handleSubmitLicense}
                className="h-11 shrink-0 rounded-full bg-linear-to-r from-orange-400 to-pink-500 px-6 text-sm font-semibold text-white shadow-md hover:from-orange-500 hover:to-pink-600 disabled:opacity-50"
              >
                {t('activate_submit')}
              </Button>
            </div>
            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
              <Info className="mt-0.5 size-3.5 shrink-0 text-sky-500" aria-hidden />
              {t('activate_license_hint')}
            </p>
          </>
        )}
      </ActivateHeaderChrome>

      <div className="scrollbar-themed min-h-0 flex-1 overflow-auto bg-white">
        {loading ? (
          <ActivateLoading label={t('activate_loading')} />
        ) : !tools?.length ? (
          <p className="text-muted-foreground px-5 py-8 text-center text-sm">
            {t('activate_empty')}
          </p>
        ) : (
          <ul className="flex flex-col">
            {tools.map((tool) => {
              const i18nKey = toolIdToI18nKey(tool.id)
              return (
                <ActivateProductRow
                  key={tool.id}
                  tool={tool}
                  hostPlatform={hostPlatform}
                  installed={!!installByToolId[tool.id]?.installed}
                  title={tTools(`${i18nKey}.title`)}
                  description={tTools(`${i18nKey}.description`)}
                  iconGrad={toolLauncherIconGradient(tool.id)}
                  onInstallStateRefresh={refreshInstallState}
                />
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
