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
