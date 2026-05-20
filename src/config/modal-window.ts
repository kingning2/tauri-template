import { closeModalWindow, openModalWindow } from "@/cmd/window";

export { MODAL_CLOSED_EVENT, MODAL_OPENED_EVENT } from "@/config/window-events";

export const MODAL_LABEL_PREFIX = "modal";

import type { ModalPanelName } from "@/components/modal/panels";

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
