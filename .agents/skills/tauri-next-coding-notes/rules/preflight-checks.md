# Preflight Checks

## 必做检查

1. 前端：`bun run check`（含 `prettier --check`、`eslint`、`tsc --noEmit`）
2. Rust 改动时：`bun run check:rust`（manifest 单测 + `cargo check`）
3. 改了 `#[typeshare]` 或 `tools_manifest.json` 结构：`bun run generate:contracts`（CI 可用 `bun run check:contracts` 校验已提交产物）
4. i18n key 双语同步
5. 标题栏拖拽与菜单交互互不冲突
6. 主窗常见尺寸下无意外滚动条

## 建议

- 提交前手测：语言切换、下载按钮、窗口最小化/最大化/关闭。
