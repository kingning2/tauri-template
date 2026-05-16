import * as React from 'react'

import { cn } from '@/lib/utils'

export type ShadowCardProps = React.HTMLAttributes<HTMLDivElement>

/**
 * A Card-like container with consistent rounded corners and hover lift + shadow.
 * Designed to avoid "overflow-hidden" clipping during translate/hover.
 */
export const ShadowCard = React.forwardRef<HTMLDivElement, ShadowCardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'shadow-card relative z-0 overflow-visible rounded-xl border bg-card text-card-foreground',
        'transform-gpu focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      {...props}
    />
  )
)

ShadowCard.displayName = 'ShadowCard'

