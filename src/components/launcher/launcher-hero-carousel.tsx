'use client'

import {
  Shield,
  Smartphone,
  Wrench
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

const SLIDE_COUNT = 3
const AUTO_MS = 7000

const slideIcons = [Wrench, Smartphone, Shield] as const

export default function LauncherHeroCarousel() {
  const { t } = useTranslation('launcher')
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % SLIDE_COUNT)
    }, AUTO_MS)
    return () => window.clearInterval(id)
  }, [])

  const go = useCallback((i: number) => {
    setActive(i % SLIDE_COUNT)
  }, [])

  const titles = [t('slide1_title'), t('slide2_title'), t('slide3_title')]
  const subtitles = [
    t('slide1_subtitle'),
    t('slide2_subtitle'),
    t('slide3_subtitle')
  ]

  return (
    <Card
      className={cn(
        'relative flex h-full min-h-0 flex-col overflow-hidden border-0',
        'bg-linear-to-r from-[#1e6bff] via-[#3b82f6] to-[#60a5fa] text-white shadow-lg'
      )}
    >
      <div className="relative flex min-h-0 flex-1 flex-col px-5 pb-8 pt-5 sm:flex-row sm:items-stretch sm:gap-6 sm:pb-7 sm:pt-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              {(() => {
                const Icon = slideIcons[active] ?? Wrench
                return <Icon className="size-8 text-white" aria-hidden />
              })()}
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-xl font-semibold leading-snug text-white sm:text-2xl">
                {titles[active]}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed text-white/85">
                {subtitles[active]}
              </CardDescription>
            </div>
          </div>
        </div>

        <div
          className="relative mt-4 flex shrink-0 items-center justify-center sm:mt-0 sm:w-[min(42%,220px)]"
          aria-hidden
        >
          <div className="flex items-end justify-center gap-1.5 opacity-95">
            <div className="h-24 w-11 rounded-lg border border-white/35 bg-white/10 shadow-inner sm:h-28 sm:w-12" />
            <div className="h-28 w-12 rounded-lg border border-white/45 bg-white/15 shadow-inner sm:h-32 sm:w-[52px]" />
            <div className="h-24 w-11 rounded-lg border border-white/35 bg-white/10 shadow-inner sm:h-28 sm:w-12" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {Array.from({ length: SLIDE_COUNT }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={t('carousel_goto', { index: i + 1 })}
            aria-current={i === active ? 'true' : undefined}
            className={cn(
              'size-2 rounded-full transition-colors',
              i === active ? 'bg-white' : 'bg-white/35 hover:bg-white/55'
            )}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </Card>
  )
}
