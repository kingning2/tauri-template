"use client";

import { useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import {
  MODAL_CLOSED_EVENT,
  MODAL_OPENED_EVENT,
  type ModalLifecyclePayload
} from "@/config/window-events";
import { MAIN_WINDOW_LABEL } from "@/config/popup-window";
import { useAppDispatch } from "@/store/hooks";
import { modalClosedAction, modalOpenedAction } from "@/store/modules/modal";

/**
 * 主窗监听 Rust 发来的 modal 开/关事件（emit_to main），驱动蒙层。
 */
export function ModalWindowProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const webview = getCurrentWebviewWindow();
    if (webview.label !== MAIN_WINDOW_LABEL) return;

    const unlisteners: Array<() => void> = [];

    void webview
      .listen<ModalLifecyclePayload>(MODAL_OPENED_EVENT, (event) => {
        dispatch(modalOpenedAction(event.payload.label));
      })
      .then((unlisten) => unlisteners.push(unlisten));

    void webview
      .listen<ModalLifecyclePayload>(MODAL_CLOSED_EVENT, (event) => {
        dispatch(modalClosedAction(event.payload.label));
      })
      .then((unlisten) => unlisteners.push(unlisten));

    return () => {
      for (const unlisten of unlisteners) unlisten();
    };
  }, [dispatch]);

  return <>{children}</>;
}
