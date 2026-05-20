# Logging and Errors

## Rule

- 业务调用 Tauri **Command** 走 `invokeWrapper`（`src/cmd/invoke.ts`）；失败会自动 `log` 并抛出 `InvokeError`。
- 写 Rust 日志走 **Event**：`src/cmd/log.ts` → `tauriEmit(FE_LOG_EVENT | FE_LOG_REQ_EVENT, …)`，由 `events/handlers/fe_log.rs` 写入 tracing（避免与 `invokeWrapper` 循环依赖）。
- 不要为日志新增 `log_fe` 类 invoke command。
- 页面级错误边界记录错误后提供可恢复操作（`reset` / 返回首页）。
- 异步日志调用使用 `void`，不阻塞 UI。

## Example

```tsx
useEffect(() => {
  void log('error', `main-window err capture: ${error.message}`)
}, [error])
```
