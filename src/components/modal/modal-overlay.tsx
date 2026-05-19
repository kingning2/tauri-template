"use client";

import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

export type ModalOverlayProps = {
  className?: string;
};

/**
 * 主窗蒙层：有 modal 子窗口时盖住标题栏与内容区，阻止主窗交互。
 */
export function ModalOverlay({ className }: ModalOverlayProps) {
  const openLabels = useAppSelector((state) => state.modal.openLabels);

  if (openLabels.length <= 0) return null;

  return (
    <div
      role="presentation"
      aria-hidden
      className={cn(
        "pointer-events-auto absolute inset-0 z-[200] bg-slate-900/45 backdrop-blur-[1px]",
        className
      )}
    />
  );
}
