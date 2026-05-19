# Architecture Snapshot

## 目录职责

- `src/app/*`：页面与路由层（App Router）。
- `src/components/*`：业务组件与 UI 组件。
- `src/cmd/*`：前端到 Tauri 的命令封装（invoke 入口）。
- `src/store/*`：Redux 模块与 hooks。
- `src-tauri/src/cmd/*`：Rust 侧 command 实现。
- `src-tauri/resources/languages/*.json`：语言资源。

## 调用链

1. 前端页面调用 `src/cmd/*.ts`。
2. `src/cmd/*.ts` 走 `invokeWrapper`。
3. Rust command 在 `src-tauri/src/cmd/*.rs`。
4. `src-tauri/src/lib.rs` 注册 `generate_handler!`。

## 前后端契约

- Rust 类型标注 `#[typeshare]` / `JsonSchema` → `bun run generate:contracts` 生成 `src/generated/contracts.ts` 与 `schemas/tools_manifest.schema.json`。
- `src-tauri/build.rs` 在构建时用 JSON Schema 校验 `resources/tools_manifest.json`。
- 业务辅助函数仍在 `src/config/tools-manifest.ts`；IPC 类型优先从 `@/generated/contracts` 引用。

## 下载状态

- 按 `toolId` 存在 Redux `download.byToolId`，支持多卡片并行下载。
- 组件通过 `useToolDownload(toolId)` 读写全局状态。

## i18n 流程

1. `get_lang` 获取当前语言。
2. `get_language_resource_bundle` 从资源目录读取 JSON。
3. `LanguageGuard` 注入 i18next bundle。
4. 页面通过 `useTranslation(namespace)` 取文案。

## 主窗布局原则

- 标题栏高度独立。
- 主内容区优先固定高度下排版，不依赖全局滚动。
- 需要滚动时，只让最内层业务区域滚动。
