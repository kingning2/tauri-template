---
name: tauri-next-coding-notes
description: Enforces architecture rules and reusable coding patterns for this Tauri + Next.js desktop app. Use when implementing Tauri commands or events, frontend pages/components, i18n copy, Redux logic, title bar behavior, modal windows, or main-window layout.
user-invocable: true
---

# Tauri + Next 编码规范

本技能用于本仓库日常开发，不是通用模板。优先遵守已存在目录结构与命名方式。

## 关键上下文

- 前端：Next App Router + React + Redux Toolkit + shadcn/ui。
- **Command 桥接**：`src/cmd/index.ts` 的 `invokeWrapper`（请求/响应）。
- **Event 桥接**：`src-tauri/src/events/` ↔ `src/config/window-events.ts` + `src/utils/tauri-event.ts` + `TauriEventProvider`。
- Rust 入口：`src-tauri/src/lib.rs`（`generate_handler!` + `events::setup`）。
- i18n：`react-i18next` + `src-tauri/resources/languages/*.json`。
- 主窗：`TitleBar` + `ContentContainer`，重点防止滚动条。

## Critical Rules

以下规则是强约束，改动前先读对应文件：

1. **Tauri 命令链路完整性** → [tauri-command-chain.md](./rules/tauri-command-chain.md)
2. **Tauri 事件总线** → [tauri-events.md](./rules/tauri-events.md)
3. **i18n 与文案规范** → [i18n-and-copy.md](./rules/i18n-and-copy.md)
4. **主窗布局与滚动控制** → [layout-and-scroll.md](./rules/layout-and-scroll.md)
5. **标题栏拖拽与交互区域** → [titlebar-drag-region.md](./rules/titlebar-drag-region.md)
6. **状态与副作用边界** → [state-and-effects.md](./rules/state-and-effects.md)
7. **日志与错误处理** → [logging-and-errors.md](./rules/logging-and-errors.md)
8. **提交前检查** → [preflight-checks.md](./rules/preflight-checks.md)

## 快速模式（常用）

```tsx
// 页面文本永远走 i18n key
const { t } = useTranslation('launcher')
<h1>{t('slide1_title')}</h1>

// 主窗根布局：持续传递 min-h-0 / flex-1 / overflow-hidden
<ContentContainer className="flex flex-col overflow-hidden">{children}</ContentContainer>
```

```rust
// 新增 tauri command 后，必须进入 lib.rs handler
.invoke_handler(tauri::generate_handler![
  // ...
  cmd::xxx::your_command,
])
```

```tsx
// 订阅 Rust 推送（须在 TauriEventProvider 内）
useTauriEventPayload<AppSession>(SESSION_CHANGED_EVENT, (session) => { /* sync store */ })
```

```rust
// Rust → 前端：走 events::emit，勿在 utils 里硬编码事件名
crate::events::session_changed_all(app, &session)?;
```

## 参考资料

- 架构与目录： [architecture.md](./architecture.md)
- 场景化片段： [examples.md](./examples.md)
