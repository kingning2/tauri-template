# Logging and Errors

## Rule

- 关键路径与异常统一走 `src/cmd/log.ts`。
- 页面级错误边界记录错误后提供可恢复操作（`reset` / 返回首页）。
- 异步日志调用使用 `void`，不阻塞 UI。

## Example

```tsx
useEffect(() => {
  void log('error', `main-window err capture: ${error.message}`)
}, [error])
```
