# Tauri Event Bus

## 何时用 Event，何时用 Command

| 场景 | 选用 |
|------|------|
| 需要返回值 / `Result` 错误 | **Command** + `invokeWrapper` |
| 跨 Webview 广播（会话、下载态、安装态、modal 蒙层） | **Event**（Rust `emit` / `emit_to`） |
| 前端 → Rust 单向（如写日志） | **Event**（`tauriEmit` + Rust `listen`） |
| 全局 Redux 同步（会话、下载） | **`CrossWebviewSyncSubscriptions`**（`events/cross-webview-sync.ts`） |
| 页面局部安装态 | **`useToolsInstallStateSync`**（同文件） |

## 事件名（双端同步）

Rust `src-tauri/src/events/names.rs` 与前端 `src/config/window-events.ts` **必须一致**。

当前约定示例：

- Rust → 前端：`session/changed`、`tools/download/changed`、`tools/install-state/changed`、`modal/opened`、`modal/closed`
- 前端 → Rust：`fe/log`、`fe/log-req`（新前端事件建议 `fe/<domain>/<action>`）

主窗 label：`main`（`MAIN_WINDOW_LABEL`）。

## Rust 侧改动清单

1. 在 `events/names.rs` 增加常量
2. 在 `events/payloads.rs` 定义载荷（需导出到 TS 时加 `#[typeshare]`，并 `bun run generate:contracts`）
3. **Rust → 前端**：在 `events/emit.rs` 增加函数，从 `context` / `utils` / `cmd` 调用，不要散落 `app.emit_to`
4. **前端 → Rust**：在 `events/handlers/` 增加 handler，并在 `handlers/mod.rs` 的 `register_fe_handlers` 注册
5. `lib.rs` 的 `setup` 已调用 `events::setup`，一般无需再改

## 前端侧改动清单

1. 在 `src/config/window-events.ts` 增加常量与 payload 类型
2. 发送：`tauriEmit` / `tauriEmitTo`（`src/utils/tauri-event.ts`）或 `useTauriEventApi().emit`
3. 全局订阅：在 `events/cross-webview-sync.ts` 扩展，或页面内 `tauriOn` / `useTauriEventApi().on`
4. 根布局已包 `TauriEventProvider`（`src/app/layout.tsx`）

## Incorrect

```ts
// ❌ 日志再走 invoke command
await invoke('log_fe', { event: 'info', msg })
```

```ts
// ❌ 各 Webview 各自 dispatch 下载进度（会与 Rust 源真相分叉）
dispatch(downloadProgressUpdated({ toolId, downloaded }))
```

```rust
// ❌ 在 utils 里直接写死事件名字符串
app.emit_to("main", "session/changed", &session)?;
```

## Correct

```ts
import { FE_LOG_EVENT } from '@/config/window-events'
import { tauriEmit } from '@/utils/tauri-event'

await tauriEmit(FE_LOG_EVENT, { level: 'info', msg: 'ready' })
```

```ts
// 页面监听安装态（非 Redux）
import { useToolsInstallStateSync } from '@/events/cross-webview-sync'

useToolsInstallStateSync(setInstallByToolId)
```

```rust
crate::events::session_changed_to(app, webview_label, &session)?;
```
