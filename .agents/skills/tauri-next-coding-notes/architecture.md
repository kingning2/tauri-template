# Architecture Snapshot

## 目录职责

- `src/app/*`：页面与路由层（App Router）。
- `src/components/*`：业务组件与 UI 组件。
- `src/cmd/*`：前端到 Tauri 的命令封装（invoke 入口）。
- `src/config/windows.ts`：主窗 / modal 窗口 label、尺寸与打开命令封装。
- `src/config/window-events.ts`：事件名常量（与 Rust `events/names.rs` 对齐）。
- `src/events/cross-webview-sync.ts`：跨 Webview 状态同步（会话、下载 Redux、安装态订阅）。
- `src/providers/tauri-event-provider.tsx`：Tauri emit/listen API + 挂载 `CrossWebviewSyncSubscriptions`。
- `src/store/*`：Redux 模块与 hooks。
- `src-tauri/src/cmd/*`：Rust command 薄入口。
- `src-tauri/src/context/*`：`.manage` 持有的跨 Webview 共享态（会话、工具下载快照）。
- `src-tauri/src/utils/*`：无 Store 的业务逻辑；`platform/` 分平台实现。
- `src-tauri/resources/languages/*.json`：语言资源。

## 调用链

### Command（invoke）

1. 前端页面调用 `src/cmd/*.ts`。
2. `src/cmd/*.ts` 走 `invokeWrapper`。
3. Rust command 在 `src-tauri/src/cmd/*.rs`（薄封装，逻辑在 `utils/` 或 `context/`）。
4. `src-tauri/src/lib.rs` 注册 `generate_handler!`。

### Event（emit / listen）

1. 事件名：前端 `src/config/window-events.ts` ↔ Rust `events/names.rs`。
2. Rust → 前端：`events/emit.rs`（会话、下载态、安装态、modal 生命周期等）。
3. 前端 → Rust：`tauriEmit` → `events/handlers/*`（如 `fe/log`）。
4. 全局订阅：`TauriEventProvider` 内 `CrossWebviewSyncSubscriptions`（会话 + 下载 → Redux）。
5. 页面级安装态：`useToolsInstallStateSync`（同文件，本地 `useState`）。
6. `lib.rs` 的 `setup` 调用 `events::setup` 注册 listen。

## 前后端契约

- Rust 类型标注 `#[typeshare]` / `JsonSchema` → `bun run generate:contracts` 生成 `src/generated/contracts.ts` 与 `schemas/tools_manifest.schema.json`。
- `src-tauri/build.rs` 在构建时用 JSON Schema 校验 `resources/tools_manifest.json`。
- 业务辅助函数仍在 `src/config/tools-manifest.ts`；IPC 类型优先从 `@/generated/contracts` 引用。

## 下载状态

- **Rust 源真相**：`context/tools_download.rs`（`ToolsDownloadStore`），进度与完成/失败由 `utils/download` 回调更新并 `tools/download/changed` 广播。
- **前端镜像**：Redux `download.byToolId`，仅通过 `downloadSnapshotApplied` 与 Rust 快照对齐。
- 组件通过 `useToolDownload(toolId)` 读 Redux、经 command 触发下载/重置。

## i18n 流程

1. `get_lang` / `get_app_session` 获取当前语言。
2. `get_language_resource_bundle` 从资源目录读取 JSON。
3. `LanguageGuard` 注入 i18next bundle。
4. 页面通过 `useTranslation(namespace)` 取文案。
5. `set_lang` 写 Rust `context/session` 后广播 `session/changed`。

## 主窗布局原则

- 标题栏高度独立。
- 主内容区优先固定高度下排版，不依赖全局滚动。
- 需要滚动时，只让最内层业务区域滚动。
