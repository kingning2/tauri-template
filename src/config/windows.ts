import { LogicalSize, Window } from "@tauri-apps/api/window";

import { closeModalWindow, openModalWindow } from "@/cmd/window";
import { MAIN_WINDOW_LABEL } from "@/config/window-events";

import type { ModalPanelName } from "@/components/modal/panels";

export type WindowLabel = typeof MAIN_WINDOW_LABEL;

export { MAIN_WINDOW_LABEL, MODAL_CLOSED_EVENT, MODAL_OPENED_EVENT } from "@/config/window-events";

/** 与 unlock-next-app 一致：固定 label，供标题栏拖动与窗口 API 使用 */
export const mainWindow = new Window(MAIN_WINDOW_LABEL);

/**
 * 在 WebView 内注册主窗体行为（与 unlock `global-provider` 里 `initWindowConfig()` 对齐）。
 * - DPI / 缩放变化时恢复逻辑尺寸，避免无边框窗在高分屏下尺寸漂移
 * - 关闭请求时销毁所有窗口（多窗场景下一并退出）
 */
export function initWindowConfig() {
  if (typeof window === "undefined") return;

  void mainWindow.onScaleChanged(() => {
    const logicalSize = new LogicalSize(1200, 800);
    void mainWindow.setSize(logicalSize);
  });

  void mainWindow.onCloseRequested(async () => {
    const allWindow = await Window.getAll();
    await Promise.all(allWindow.map((w) => w.destroy()));
  });
}

// --- Modal 子窗口 ---

export const MODAL_LABEL_PREFIX = "modal";

export type OpenModalWindowOptions = {
  /** 面板组件名，对应 `src/components/modal/panels` 注册表（如 `activate`） */
  name: ModalPanelName;
  title?: string;
  width?: number;
  height?: number;
  /** 固定 label；省略则由 Rust 自动生成 `modal-N` */
  label?: string;
};

function modalWindowPath(name: string): string {
  return `/modal-window?name=${encodeURIComponent(name)}`;
}

export function isModalWindowLabel(label: string): boolean {
  return label === MODAL_LABEL_PREFIX || label.startsWith(`${MODAL_LABEL_PREFIX}-`);
}

/** 通过 Rust command 打开 modal 子窗口（非前端 WebviewWindow API） */
export async function openModalWindowCommand(options: OpenModalWindowOptions): Promise<string> {
  return openModalWindow({
    path: modalWindowPath(options.name),
    title: options.title,
    width: options.width,
    height: options.height,
    label: options.label
  });
}

export async function closeModalWindowCommand(label: string): Promise<void> {
  await closeModalWindow(label);
}
