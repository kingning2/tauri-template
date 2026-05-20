"use client";

import { useCallback, useEffect, useRef } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import {
  MODAL_CLOSED_EVENT,
  MODAL_OPENED_EVENT,
  type ModalLifecyclePayload
} from "@/config/window-events";
import {
  closeModalWindowCommand,
  MAIN_WINDOW_LABEL,
  openModalWindowCommand,
  preloadModalWindowCommand,
  type OpenModalWindowOptions
} from "@/config/windows";
import { useAppDispatch } from "@/store/hooks";
import { modalClosedAction, modalOpenedAction } from "@/store/modules/modal";

export {
  Modal,
  ModalMotionProvider,
  ModalOverlay,
  ModalPanelHost,
  onModalDragMouseDown,
  useModalMotion,
  type ModalOverlayProps,
  type ModalProps
} from "./modal";

export type { ModalPanelName } from "./panels";
export { MODAL_PANEL_REGISTRY } from "./panels";

export function useModalWindow() {
  const openModal = useCallback(async (options: OpenModalWindowOptions) => {
    return openModalWindowCommand(options);
  }, []);

  const closeModal = useCallback(async (label: string) => {
    await closeModalWindowCommand(label);
  }, []);

  return { openModal, closeModal };
}

function useModalPreload() {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    if (getCurrentWebviewWindow().label !== MAIN_WINDOW_LABEL) return;

    startedRef.current = true;

    const run = () => {
      void preloadModalWindowCommand().catch(() => undefined);
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = window.setTimeout(run, 600);
    return () => window.clearTimeout(timer);
  }, []);
}

/** 主窗监听 modal 开/关，驱动蒙层与预热 */
export function ModalWindowProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  useModalPreload();

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

  return children;
}
