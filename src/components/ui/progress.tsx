"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

type ProgressVariant = "default" | "pillOutline"

type ProgressProps = React.ComponentPropsWithoutRef<
  typeof ProgressPrimitive.Root
> & {
  /** `pillOutline`：白底 + 蓝色描边胶囊条（下载态参考样式） */
  variant?: ProgressVariant
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "default", ...props }, ref) => {
  const determinate = typeof value === "number" && !Number.isNaN(value)
  const outline = variant === "pillOutline"
  const fill = outline ? "bg-sky-500" : "bg-primary"

  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      className={cn(
        "relative w-full overflow-hidden rounded-full",
        outline
          ? "h-2.5 border-2 border-sky-500 bg-white"
          : "h-2 bg-primary/20",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full",
          fill,
          determinate
            ? "w-full flex-1 transition-transform duration-300 ease-out"
            : "absolute inset-y-0 left-0 w-[40%] max-w-[40%] motion-safe:animate-[progress-indeterminate_1.35s_ease-in-out_infinite]"
        )}
        style={
          determinate
            ? { transform: `translateX(-${100 - value}%)` }
            : undefined
        }
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
