# State and Effects

## Rule

- 全局共享状态进 Redux（如语言、modal 蒙层、下载镜像）。
- 跨 Webview **源真相在 Rust `context/`**（会话、工具下载快照）；前端 Redux 只镜像，经 `events/cross-webview-sync.ts` 订阅 event 或启动时 `get_*_state` command。
- 工具**安装态**目前为页面级 `useState` + `useToolsInstallStateSync`（同文件），下载完成后调用 `refreshToolsInstallStateAcrossWindows()`。
- 组件局部 UI 状态用 `useState`。
- `useEffect` 依赖完整，不用无必要空依赖硬跳过。

## Incorrect

在多个组件中各自缓存 `currentLanguage`，不走 store。

各 Webview 在 `onProgress` 里直接 `dispatch` 下载进度（应与 Rust `tools/download/changed` 一致）。

## Correct

统一 `useAppSelector((s) => s.app.currentLanguage)`，通过 action 修改。

跨 Webview 会话：Rust `set_lang` → `session/changed` → `CrossWebviewSyncSubscriptions` → `changeCurrentLanguageAction`。

跨 Webview 下载：`download_tool` 更新 `context/tools_download` 并广播 → `downloadSnapshotApplied`。

首屏会话：`InitGuard` 调用 `get_app_session` + `applySessionToStore`（与 event 订阅互补）。
