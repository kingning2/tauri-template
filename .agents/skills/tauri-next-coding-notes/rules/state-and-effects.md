# State and Effects

## Rule

- 全局共享状态进 Redux（如语言、标题栏高度、初始化状态）。
- 组件局部 UI 状态用 `useState`。
- `useEffect` 依赖完整，不用无必要空依赖硬跳过。

## Incorrect

在多个组件中各自缓存 `currentLanguage`，不走 store。

## Correct

统一 `useAppSelector((s) => s.app.currentLanguage)`，通过 action 修改。
