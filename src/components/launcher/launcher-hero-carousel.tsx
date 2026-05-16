'use client'

import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Smartphone,
  Wrench
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Card,
  CardDescription,
  CardTitle
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

const SLIDE_COUNT = 3
const AUTO_MS = 7000
const FLIP_MS = 650

const slideIcons = [Wrench, Smartphone, Shield] as const

export default function LauncherHeroCarousel() {
  const { t } = useTranslation('launcher')
  const [active, setActive] = useState(0)
  const [next, setNext] = useState<number | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [lock, setLock] = useState(false)
  const [disableTransition, setDisableTransition] = useState(false)
  const [showNav, setShowNav] = useState(false)
  const flipTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (lock) return

    const id = window.setTimeout(() => {
      flipTo((active + 1) % SLIDE_COUNT)
    }, AUTO_MS)

    return () => window.clearTimeout(id)
  }, [active, lock])

  const flipTo = useCallback(
    (target: number) => {
      if (lock) return

      const normalized = ((target % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT
      if (normalized === active) return

      setNext(normalized)
      setLock(true)

      // Wait 1 frame so the "back" side mounts at rotateY(90deg),
      // then transition to rotateY(0deg) (flip effect).
      window.requestAnimationFrame(() => {
        setIsFlipping(true)

        if (flipTimerRef.current !== null) {
          window.clearTimeout(flipTimerRef.current)
        }

        flipTimerRef.current = window.setTimeout(() => {
          // Swap content without animating the "reset" back to rotateY(0deg).
          setDisableTransition(true)
          setActive(normalized)
          setNext(null)
          setIsFlipping(false)
          setLock(false)
          flipTimerRef.current = null

          window.requestAnimationFrame(() => {
            setDisableTransition(false)
          })
        }, FLIP_MS)
      })
    },
    [active, lock]
  )

  useEffect(() => {
    return () => {
      if (flipTimerRef.current !== null) {
        window.clearTimeout(flipTimerRef.current)
      }
    }
  }, [])

  const titles = [t('slide1_title'), t('slide2_title'), t('slide3_title')]
  const subtitles = [
    t('slide1_subtitle'),
    t('slide2_subtitle'),
    t('slide3_subtitle')
  ]

  return (
    <Card
      onMouseEnter={() => setShowNav(true)}
      onMouseLeave={() => setShowNav(false)}
      className={cn(
        'relative flex h-full min-h-0 flex-col border-0 cursor-pointer',
        // Override Card's default `shadow` with our own rounded, blurred shadow.
        'shadow-none',
        'bg-linear-to-r from-[#1e6bff] via-[#3b82f6] to-[#60a5fa] text-white'
      )}
    >
      {/* Rounded downward blurred shadow (about a few px, but softly spread) */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 z-0 h-10 w-[120%] -translate-x-1/2 translate-y-1/3 rounded-b-xl bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.22)_0%,rgba(0,0,0,0.08)_35%,rgba(0,0,0,0)_70%)] blur-[18px]"
      />

      {/* Hover navigation (prev / next) */}
      <button
        type="button"
        aria-label={t('carousel_prev')}
        disabled={lock}
        onClick={() => flipTo((active - 1 + SLIDE_COUNT) % SLIDE_COUNT)}
        className={cn(
          'absolute left-2 top-1/2 -translate-y-1/2 p-2 cursor-pointer',
          'rounded-full border border-white/25 bg-white/10 backdrop-blur',
          'transition-all duration-300 ease-out',
          'z-20',
          showNav
            ? 'opacity-100 pointer-events-auto translate-y-0'
            : 'opacity-0 pointer-events-none translate-y-4'
        )}
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        aria-label={t('carousel_next')}
        disabled={lock}
        onClick={() => flipTo((active + 1) % SLIDE_COUNT)}
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2 p-2 cursor-pointer',
          'rounded-full border border-white/25 bg-white/10 backdrop-blur',
          'transition-all duration-300 ease-out',
          'z-20',
          showNav
            ? 'opacity-100 pointer-events-auto translate-y-0'
            : 'opacity-0 pointer-events-none translate-y-4'
        )}
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 pb-8 pt-5 sm:flex-row sm:items-stretch sm:gap-6 sm:pb-7 sm:pt-6">
        <div
          className="relative flex min-h-0 flex-1 flex-col pointer-events-none"
          style={{ perspective: 1000 }}
          aria-live="polite"
        >
          {/* Front (current slide) */}
          <div
            className="flex min-h-0 flex-1 flex-col sm:flex-row sm:items-stretch sm:gap-6"
            style={{
              backfaceVisibility: 'hidden',
              transformStyle: 'preserve-3d',
              transformOrigin: 'left center',
              transform: isFlipping ? 'rotateY(-90deg)' : 'rotateY(0deg)',
              transition: disableTransition ? 'none' : `transform ${FLIP_MS}ms ease`,
            }}
          >
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

          {/* Back (next slide) */}
          {next !== null && (
            <div
              className="absolute inset-0 flex min-h-0 flex-1 flex-col sm:flex-row sm:items-stretch sm:gap-6"
              style={{
                backfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center',
                transform: isFlipping ? 'rotateY(0deg)' : 'rotateY(90deg)',
                opacity: isFlipping ? 1 : 0,
                transition: disableTransition
                  ? 'none'
                  : `transform ${FLIP_MS}ms ease, opacity 200ms ease`,
              }}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                    {(() => {
                      const Icon = slideIcons[next] ?? Wrench
                      return <Icon className="size-8 text-white" aria-hidden />
                    })()}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-xl font-semibold leading-snug text-white sm:text-2xl">
                      {titles[next]}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-white/85">
                      {subtitles[next]}
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
          )}
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
              'size-2 rounded-full transition-colors cursor-pointer',
              i === active ? 'bg-white' : 'bg-white/35 hover:bg-white/55'
            )}
            onClick={() => flipTo(i)}
          />
        ))}
      </div>
    </Card>
  )
}
