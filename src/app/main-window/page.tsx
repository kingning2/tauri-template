'use client'

import { useEffect, useState } from 'react'

import LauncherHeroCarousel from '@/components/launcher/launcher-hero-carousel'
import LauncherToolCard from '@/components/launcher/launcher-tool-card'
import { getRuntimeHostPlatform, getToolsManifest } from '@/cmd/tools'
import type { HostDesktopPlatform, ToolManifest } from '@/config/tools-manifest'
import { mainWindowBg } from '@/config/main-window-bg'
import { ToolVariant } from '@/enums/tool-variant'
import { useAppDispatch } from '@/store/hooks'
import { changeMainWindowGlobalGgAction } from '@/store/modules/app'

export default function MainWindowHome() {
  const dispatch = useAppDispatch()
  const [tools, setTools] = useState<ToolManifest[] | null>(null)
  const [hostPlatform, setHostPlatform] = useState<HostDesktopPlatform | null>(null)

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
    void getToolsManifest().then((list) => {
      if (!cancelled) setTools(list)
    })
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

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 overflow-visible lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)] lg:grid-rows-1">
        <LauncherToolCard tool={hero} hostPlatform={hostPlatform} className="min-h-0" />

        <div className="grid min-h-0 grid-rows-2 gap-3 overflow-visible">
          <div className="grid min-h-0 grid-cols-2 gap-3 overflow-visible">
            {mediums.map((tool) => (
              <LauncherToolCard
                key={tool.id}
                tool={tool}
                hostPlatform={hostPlatform}
                className="min-h-0"
              />
            ))}
          </div>
          <div className="grid min-h-0 grid-cols-2 gap-3 overflow-visible sm:grid-cols-4">
            {smalls.map((tool) => (
              <LauncherToolCard
                key={tool.id}
                tool={tool}
                hostPlatform={hostPlatform}
                className="min-h-0"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
