'use client'

import { useCallback, useEffect, useState } from 'react'

import LauncherHeroCarousel from '@/components/launcher/launcher-hero-carousel'
import LauncherLargeToolCard from '@/components/launcher/launcher-large-tool-card'
import LauncherMediumToolCard from '@/components/launcher/launcher-medium-tool-card'
import LauncherSmallToolCard from '@/components/launcher/launcher-small-tool-card'
import { getRuntimeHostPlatform, getToolsInstallState, getToolsManifest } from '@/cmd/tools'
import type { HostDesktopPlatform, ToolInstallState, ToolManifest } from '@/config/tools-manifest'
import { mainWindowBg } from '@/config/main-window-bg'
import { ToolVariant } from '@/enums/tool-variant'
import { useAppDispatch } from '@/store/hooks'
import { changeMainWindowGlobalGgAction } from '@/store/modules/app'

export default function MainWindowHome() {
  const dispatch = useAppDispatch()
  const [tools, setTools] = useState<ToolManifest[] | null>(null)
  const [hostPlatform, setHostPlatform] = useState<HostDesktopPlatform | null>(null)
  const [installByToolId, setInstallByToolId] = useState<
    Record<string, ToolInstallState>
  >({})

  const refreshInstallState = useCallback(() => {
    void getToolsInstallState().then((list) => {
      setInstallByToolId(Object.fromEntries(list.map((s) => [s.toolId, s])))
    })
  }, [])

  useEffect(() => {
    dispatch(
      changeMainWindowGlobalGgAction(
        mainWindowBg.heroGradient
      )
    )
    return () => {
      dispatch(changeMainWindowGlobalGgAction(mainWindowBg.base))
    }
  }, [dispatch])

  useEffect(() => {
    let cancelled = false
    void Promise.all([getToolsManifest(), getToolsInstallState()]).then(
      ([list, installList]) => {
        if (cancelled) return
        setTools(list)
        setInstallByToolId(
          Object.fromEntries(installList.map((s) => [s.toolId, s]))
        )
      }
    )
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void getRuntimeHostPlatform().then((p) => {
      if (!cancelled) setHostPlatform(p)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!tools?.length) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-muted-foreground text-sm">
        Loading tools…
      </div>
    )
  }

  const hero = tools.find((tool) => tool.variant === ToolVariant.HeroLeft)!
  const mediums = tools.filter((tool) => tool.variant === ToolVariant.Medium)
  const smalls = tools.filter((tool) => tool.variant === ToolVariant.Small)

  return (
    <div className="flex flex-col gap-3 min-h-0 overflow-hidden h-full">
      <div className="min-h-0 h-[clamp(10.5rem,30vh,17.5rem)] max-h-70">
        <LauncherHeroCarousel />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 overflow-visible lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] lg:grid-rows-1">
        <LauncherLargeToolCard
          tool={hero}
          hostPlatform={hostPlatform}
          toolInstallState={installByToolId[hero.id]}
          onInstallStateRefresh={refreshInstallState}
        />

        <div className="grid min-h-0 grid-rows-2 gap-3 overflow-visible">
          <div className="grid min-h-0 grid-cols-2 gap-3 overflow-visible">
            {mediums.map((tool) => (
              <LauncherMediumToolCard
                key={tool.id}
                tool={tool}
                hostPlatform={hostPlatform}
                toolInstallState={installByToolId[tool.id]}
                onInstallStateRefresh={refreshInstallState}
              />
            ))}
          </div>
          <div className="grid min-h-0 grid-cols-2 gap-3 overflow-visible sm:grid-cols-4">
            {smalls.map((tool) => (
              <LauncherSmallToolCard
                key={tool.id}
                tool={tool}
                hostPlatform={hostPlatform}
                toolInstallState={installByToolId[tool.id]}
                onInstallStateRefresh={refreshInstallState}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
