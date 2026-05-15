'use client'

import { useEffect } from 'react'

import LauncherHeroCarousel from '@/components/launcher/launcher-hero-carousel'
import LauncherToolCard from '@/components/launcher/launcher-tool-card'
import { TOOLS_MANIFEST } from '@/config/tools-manifest'
import { useAppDispatch } from '@/store/hooks'
import { changeMainWindowGlobalGgAction } from '@/store/modules/app'

export default function MainWindowHome() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(
      changeMainWindowGlobalGgAction(
        'linear-gradient(180deg, #e4efff 0%, #eef5ff 45%, #f5f8fc 100%)'
      )
    )
    return () => {
      dispatch(changeMainWindowGlobalGgAction('#f0f4f8'))
    }
  }, [dispatch])

  const hero = TOOLS_MANIFEST.find((tool) => tool.variant === 'hero-left')!
  const mediums = TOOLS_MANIFEST.filter((tool) => tool.variant === 'medium')
  const smalls = TOOLS_MANIFEST.filter((tool) => tool.variant === 'small')

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="shrink-0 basis-[clamp(10.5rem,30vh,17.5rem)] min-h-42 max-h-70">
        <LauncherHeroCarousel />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)] lg:grid-rows-1">
        <LauncherToolCard tool={hero} className="min-h-0" />

        <div className="grid min-h-0 grid-rows-2 gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-cols-2 gap-3 overflow-hidden">
            {mediums.map((tool) => (
              <LauncherToolCard key={tool.id} tool={tool} className="min-h-0" />
            ))}
          </div>
          <div className="grid min-h-0 grid-cols-2 gap-3 overflow-hidden sm:grid-cols-4">
            {smalls.map((tool) => (
              <LauncherToolCard key={tool.id} tool={tool} className="min-h-0" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
