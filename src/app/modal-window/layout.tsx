"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";

import { ModalMotionProvider } from "@/components/modal/modal-motion-provider";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { isModalWindowLabel } from "@/config/modal-window";

export default function ModalWindowLayout({ children }: { children: React.ReactNode }) {
  useIsomorphicLayoutEffect(() => {
    const label = getCurrentWindow().label;
    if (!isModalWindowLabel(label)) return;
    document.getElementById("App")?.classList.add("modal-window-root");
  }, []);

  return <ModalMotionProvider>{children}</ModalMotionProvider>;
}
