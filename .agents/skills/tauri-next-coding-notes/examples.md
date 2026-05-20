# Examples

## 1) 新增 Tauri 命令（最小闭环）

```rust
// src-tauri/src/cmd/system.rs
#[tauri::command]
pub async fn get_system_mode() -> Result<String, String> {
    Ok("normal".to_string())
}
```

```rust
// src-tauri/src/cmd/mod.rs
pub mod system;
```

```rust
// src-tauri/src/lib.rs
.invoke_handler(tauri::generate_handler![
  // ...
  cmd::system::get_system_mode,
])
```

```ts
// src/cmd/types.ts
export type Cmd = 'get_system_mode' | /* ... */ string
```

```ts
// src/cmd/system.ts
import { invokeWrapper } from '.'
export const getSystemMode = () => invokeWrapper<string>('get_system_mode')
```

## 2) i18n 文案新增

```tsx
const { t } = useTranslation('title_bar')
<Button>{t('menu_about')}</Button>
```

```json
// src-tauri/resources/languages/cn.json
{
  "title_bar": {
    "menu_about": "關於"
  }
}
```

```json
// src-tauri/resources/languages/en.json
{
  "title_bar": {
    "menu_about": "About"
  }
}
```

## 3) 无滚动条主窗

```tsx
<ContentContainer className="flex flex-col overflow-hidden">
  <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
    <div className="shrink-0 basis-[clamp(10.5rem,30vh,17.5rem)]" />
    <div className="grid min-h-0 flex-1 overflow-hidden" />
  </div>
</ContentContainer>
```

## 4) 错误边界与日志

```tsx
'use client'
import { useEffect } from 'react'
import { log } from '@/cmd/log'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    void log('error', `main-window error: ${error.message}`)
  }, [error])
  return <button onClick={reset}>Try again</button>
}
```

## 5) 跨 Webview 状态同步

```tsx
// 根布局已挂载 TauriEventProvider → CrossWebviewSyncSubscriptions
// 会话 / 下载 Redux 无需页面手写订阅

// 首屏拉会话（与 session/changed 互补）
import { applySessionToStore } from '@/events/cross-webview-sync'
import { getAppSession } from '@/cmd/session'

void getAppSession().then((session) => applySessionToStore(store, session))
```

```tsx
// 页面安装态（本地 state + Rust 广播）
import {
  refreshToolsInstallStateAcrossWindows,
  useToolsInstallStateSync
} from '@/events/cross-webview-sync'

const [installByToolId, setInstallByToolId] = useState<Record<string, ToolInstallState>>({})
useToolsInstallStateSync(setInstallByToolId)
void refreshToolsInstallStateAcrossWindows().then((list) =>
  setInstallByToolId(installStateByToolId(list))
)
```

```tsx
// 自定义事件监听（须在 TauriEventProvider 子树内）
import { useTauriEventApi } from '@/providers/tauri-event-provider'
import { MODAL_OPENED_EVENT } from '@/config/windows'

const { on } = useTauriEventApi()
useEffect(() => on(MODAL_OPENED_EVENT, handler), [on])
```

```ts
// 前端 → Rust 日志（非 invoke）
import { log } from '@/cmd/log'
void log('info', 'modal opened')
```
