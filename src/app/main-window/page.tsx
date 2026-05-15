'use client'

import { Wrench } from 'lucide-react'
import { useEffect } from 'react'

import LauncherToolCard from '@/components/launcher/launcher-tool-card'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { TOOLS_MANIFEST } from '@/config/tools-manifest'
import { useAppDispatch } from '@/store/hooks'
import { changeMainWindowGlobalGgAction } from '@/store/modules/app'
import { cn } from '@/lib/utils'

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

  const hero = TOOLS_MANIFEST.find((t) => t.variant === 'hero-left')!
  const mediums = TOOLS_MANIFEST.filter((t) => t.variant === 'medium')
  const smalls = TOOLS_MANIFEST.filter((t) => t.variant === 'small')

  return (
    <div>
      <Card
        className={cn(
          'mb-6 border-0 bg-linear-to-r from-[#1e6bff] via-[#3b82f6] to-[#60a5fa] text-white shadow-lg'
        )}
      >
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex max-w-xl items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Wrench className="size-8 text-white" aria-hidden />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl text-white md:text-2xl">
                  EaseUS MobiXpert - System Repair
                </CardTitle>
                <CardDescription className="text-sm text-white/85">
                  Easy &amp; Efficient iOS System Repair Software
                </CardDescription>
                <div className="flex gap-1.5 pt-3" aria-hidden>
                  <span className="size-1.5 rounded-full bg-white" />
                  <span className="size-1.5 rounded-full bg-white/40" />
                  <span className="size-1.5 rounded-full bg-white/40" />
                </div>
              </div>
            </div>
            <div className="hidden shrink-0 text-6xl opacity-90 md:block" aria-hidden>
              📱
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <LauncherToolCard
            tool={hero}
            className="min-h-[280px] border-sky-100/80 bg-linear-to-b from-card to-sky-50/50 p-0"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {mediums.map((t) => (
            <LauncherToolCard key={t.id} tool={t} className="min-h-[200px]" />
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {smalls.map((t) => (
          <LauncherToolCard key={t.id} tool={t} className="min-h-[160px]" />
        ))}
      </div>
    </div>
  )
}
