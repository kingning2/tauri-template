'use client'

import { KeyRound, Menu, Minus, Square, X } from 'lucide-react'
import { memo } from 'react'

import { Button } from '@/components/ui/button'
import { mainWindow } from '@/config/popup-window'
import { cn } from '@/lib/utils'

const TitleBar = memo((props: { height?: number }) => {
  const h = props.height ?? 40

  /** 与 unlock 一致：仅当事件目标带 `data-drag-region` 时才拖动（按钮内部无此属性） */
  function handleBarMouseDown(e: React.MouseEvent) {
    const isDragRegion = Boolean((e.target as HTMLElement).dataset.dragRegion)
    if (isDragRegion && e.buttons === 1) {
      void mainWindow.startDragging()
    }
  }

  return (
    <div
      role="banner"
      data-drag-region
      className={cn(
        'flex w-full select-none items-center justify-between border-b bg-card/90 px-3 backdrop-blur'
      )}
      style={{ height: h }}
      onMouseDown={handleBarMouseDown}
    >
      {/* 左侧整块可拖：子元素不接收指针事件，事件落到本层带 data-drag-region 的父级 */}
      <div className="pointer-events-none flex min-w-0 flex-1 items-center gap-2">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#2b7fff] to-[#155dfc] text-sm font-bold text-white"
          aria-hidden
        >
          M
        </div>
        <span className="truncate text-[15px] font-semibold tracking-tight text-foreground">
          EaseUS MobiXpert
        </span>
      </div>

      <div
        className="pointer-events-auto flex shrink-0 items-center gap-2"
        data-drag-region
      >
        <Button
          type="button"
          size="sm"
          className="rounded-full border-0 bg-[#ff7a2e] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#ff6a18]"
        >
          立即購買
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full border-pink-400 bg-background px-3 text-xs font-medium text-pink-600 hover:bg-pink-50"
        >
          <KeyRound className="size-3.5" aria-hidden />
          啟用
        </Button>

        <div className="ml-1 flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            aria-label="Menu"
          >
            <Menu className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            aria-label="Minimize"
            onClick={() => void mainWindow.minimize()}
          >
            <Minus className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            aria-label="Maximize"
            onClick={() => void mainWindow.toggleMaximize()}
          >
            <Square className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Close"
            onClick={() => void mainWindow.close()}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
})

TitleBar.displayName = 'TitleBar'

export default TitleBar
