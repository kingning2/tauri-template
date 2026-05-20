import { invokeWrapper } from ".";

export type OpenModalWindowArgs = {
  path: string;
  title?: string;
  width?: number;
  height?: number;
  label?: string;
};

export const openModalWindow = (args: OpenModalWindowArgs) =>
  invokeWrapper<string>("open_modal_window", { ...args });

export const closeModalWindow = (label: string) =>
  invokeWrapper<void>("close_modal_window", { label });

export const notifyModalWindowReady = (label: string) =>
  invokeWrapper<void>("modal_window_ready", { label });

/** 主窗空闲时后台预热隐藏 modal Webview（不显示、不触发蒙层） */
export const preloadModalWindow = () => invokeWrapper<void>("preload_modal_window");
