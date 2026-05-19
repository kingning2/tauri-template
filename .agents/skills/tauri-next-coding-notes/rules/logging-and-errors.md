# Logging and Errors

## Rule

- 业务调用 Tauri 走 `invokeWrapper`（`src/cmd/invoke.ts`）；失败会自动 `log_fe` 并抛出 `InvokeError`。
- 关键路径与异常统一走 `src/cmd/log.ts`（内部用原生 `invoke`，避免与 `invokeWrapper` 循环依赖）。
- 页面级错误边界记录错误后提供可恢复操作（`reset` / 返回首页）。
- 异步日志调用使用 `void`，不阻塞 UI。

## Example

```tsx
useEffect(() => {
  void log('error', `main-window err capture: ${error.message}`)
}, [error])
```
