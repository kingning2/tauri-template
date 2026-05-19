import { LogicalSize, Window } from '@tauri-apps/api/window'

export type WindowLabel = 'main'

export const MAIN_WINDOW_LABEL = 'main' as const

/** 与 unlock-next-app 一致：固定 label，供标题栏拖动与窗口 API 使用 */
export const mainWindow = new Window(MAIN_WINDOW_LABEL)

/**
 * 在 WebView 内注册主窗体行为（与 unlock `global-provider` 里 `initWindowConfig()` 对齐）。
 * - DPI / 缩放变化时恢复逻辑尺寸，避免无边框窗在高分屏下尺寸漂移
 * - 关闭请求时销毁所有窗口（多窗场景下一并退出）
 */
export function initWindowConfig() {
  if (typeof window === 'undefined') return

  void mainWindow.onScaleChanged(() => {
    const logicalSize = new LogicalSize(1200, 800)
    void mainWindow.setSize(logicalSize)
  })

  void mainWindow.onCloseRequested(async () => {
    const allWindow = await Window.getAll()
    await Promise.all(allWindow.map((w) => w.destroy()))
  })
}
