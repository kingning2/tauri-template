"use client";

import { X } from "lucide-react";
import { useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { useModalMotion } from "@/components/modal/modal-motion-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ModalFrameProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Modal 子窗口外壳：可拖动标题区 + 关闭按钮。
 */
export function ModalFrame({ title, children, className }: ModalFrameProps) {
  const { requestClose } = useModalMotion();

  const close = useCallback(() => {
    try {
      getCurrentWindow();
      requestClose();
    } catch {
      /* 非 Tauri 环境 */
    }
  }, [requestClose]);

  return (
    <div
      className={cn(
        "modal-window flex min-h-0 flex-1 flex-col overflow-hidden bg-white",
        className
      )}
    >
      <header
        data-tauri-drag-region
        className="border-border/80 flex h-10 shrink-0 items-center justify-between border-b bg-white px-3"
      >
        <span className="text-foreground truncate text-sm font-medium">{title}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={() => void close()}
          aria-label="Close"
        >
          <X className="size-4" />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
}
