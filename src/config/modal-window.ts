import { closeModalWindow, openModalWindow } from "@/cmd/window";

export { MODAL_CLOSED_EVENT, MODAL_OPENED_EVENT } from "@/config/window-events";

export const MODAL_LABEL_PREFIX = "modal";

export type OpenModalWindowOptions = {
  /** 应用内路径，如 `/modal-window?panel=settings` */
  path: string;
  title?: string;
  width?: number;
  height?: number;
  /** 固定 label；省略则由 Rust 自动生成 `modal-N` */
  label?: string;
};

export function isModalWindowLabel(label: string): boolean {
  return label === MODAL_LABEL_PREFIX || label.startsWith(`${MODAL_LABEL_PREFIX}-`);
}

/** 通过 Rust command 打开 modal 子窗口（非前端 WebviewWindow API） */
export async function openModalWindowCommand(options: OpenModalWindowOptions): Promise<string> {
  return openModalWindow({
    path: options.path,
    title: options.title,
    width: options.width,
    height: options.height,
    label: options.label
  });
}

export async function closeModalWindowCommand(label: string): Promise<void> {
  await closeModalWindow(label);
}
