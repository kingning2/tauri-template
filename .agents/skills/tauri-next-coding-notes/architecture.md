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

## i18n 流程

1. `get_lang` 获取当前语言。
2. `get_language_resource_bundle` 从资源目录读取 JSON。
3. `LanguageGuard` 注入 i18next bundle。
4. 页面通过 `useTranslation(namespace)` 取文案。

## 主窗布局原则

- 标题栏高度独立。
- 主内容区优先固定高度下排版，不依赖全局滚动。
- 需要滚动时，只让最内层业务区域滚动。
