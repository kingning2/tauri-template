# MobiXpert（Tauri + Next.js）

桌面端工具启动器：Tauri 2 承载壳层与系统能力，Next.js App Router 负责 UI，Rust 与前端通过 **Command（invoke）** 与 **Event（emit / listen）** 两条 IPC 通道协作。

![主窗口预览](./public/main.png)

## 架构概览

本项目以 **Tauri 2 桌面壳 + Next.js 前端** 为主轴，目录按职责分层：`src/` 放页面与业务组件，`src-tauri/` 放 Rust 命令、事件与窗口逻辑，前后端契约由 typeshare 生成到 `src/generated/`。

| 能力         | 实现要点                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| **主窗**     | 无边框透明窗体 + CSS `--window-radius` 裁切，呈现圆角桌面窗口                                                         |
| **Modal**    | 非页面内 Dialog，而是由 Rust `WebviewWindowBuilder` 创建的**独立系统子窗口**（`modal` label），可预热、复用 hide/show |
| **跨窗同步** | 主窗与 modal 各为独立 Webview，通过 Event + Redux 同步会话、下载与蒙层状态                                            |
| **IPC**      | Command 走 `invoke`（有返回值）；Event 走 `emit` / `listen`（广播、modal 生命周期等）                                 |

Modal 打开链路：`src/config/windows.ts` → `src/cmd/window.ts` → `src-tauri/src/cmd/window.rs` → `utils/window.rs`；主窗监听 `modal/opened`、`modal/closed` 显示蒙层。圆角与透明底色见 `src/assets/globals.css`（`#App` / `.main-window` 使用 `clip-path` 与 `--window-radius`）。

更细的目录与调用链见下文「项目结构」与 [architecture.md](./.agents/skills/tauri-next-coding-notes/architecture.md)。

## 技术栈

| 层级   | 技术                                                   |
| ------ | ------------------------------------------------------ |
| 桌面壳 | Tauri 2                                                |
| 前端   | Next.js 16、React 19、TypeScript                       |
| 状态   | Redux Toolkit                                          |
| UI     | shadcn/ui、Tailwind CSS 4                              |
| 动画   | GSAP                                                   |
| 国际化 | react-i18next + `src-tauri/resources/languages/*.json` |
| 契约   | typeshare → `src/generated/contracts.ts`               |

## 环境要求

- [Bun](https://bun.sh/)（包管理、脚本）
- [Rust](https://www.rust-lang.org/tools/install)（`src-tauri`）
- Windows / macOS 桌面构建环境（按目标平台安装 Tauri 前置依赖）

## 常用命令

```bash
# 仅前端（浏览器，无 Tauri API）
bun run dev

# 桌面开发（Next + Tauri）
bun run tauri dev

# 提交前自检（Prettier + ESLint + tsc）
bun run check

# Rust 编译与 manifest 单测
bun run check:rust

# 从 Rust 生成前端契约类型
bun run generate:contracts

# 校验契约产物已提交且与源码一致
bun run check:contracts
```

## 项目结构（简表）

```
src/                    # Next 前端
  app/                  # 路由与页面
  cmd/                  # Tauri invoke 封装
  components/           # 业务与 UI 组件
  config/               # windows.ts、window-events.ts、tools-manifest 等
  events/               # cross-webview-sync.ts（跨窗 Redux / 安装态）
  generated/            # typeshare 生成（勿手改）
  providers/            # Redux、TauriEventProvider
  store/                # Redux slices
  utils/tauri-event.ts  # emit / listen 工具

src-tauri/src/
  cmd/                  # #[tauri::command] 薄入口
  context/              # 跨 Webview 共享态（SessionStore、下载快照）
  events/               # 事件名、载荷、emit、listen
  utils/                # 无 Store 业务逻辑；platform/ 分平台
  contracts.rs          # 对外导出契约类型
  lib.rs                # 应用入口与 handler 注册

.agents/skills/         # Agent 技能（见下文）
.cursor/rules/          # Cursor 规则（提交、Rust 分层等）
```

更细的目录与调用链见 [`.agents/skills/tauri-next-coding-notes/architecture.md`](./.agents/skills/tauri-next-coding-notes/architecture.md)。

---

## Git 提交规范

本仓库使用 **Conventional Commits + 中文简述**，由 Husky 在提交时自动校验。

### 消息格式

```
<type>(<scope>): <中文简述>
```

| 字段    | 说明                                                                                        |
| ------- | ------------------------------------------------------------------------------------------- |
| `type`  | 必填：`feat` `fix` `docs` `chore` `refactor` `perf` `test` `build` `style` `ci` `revert`    |
| `scope` | 推荐：`tauri` `frontend` `ui` `animation` `build` `deps` `data` `skills` 等，与改动模块一致 |
| 简述    | 简体中文，一句话说明「做了什么 / 为什么」，不要用英文整句当 subject                         |

### 示例

```
feat(tauri): 集中事件总线并统一前后端 IPC 收发
feat(ui): 重构下载进度、工具卡片与标题栏
fix(frontend): 修复语言切换后标题栏未刷新
chore(deps): 升级 Tauri 插件版本
docs: 补充 README 提交与编写规范
```

### Husky 钩子

| 钩子           | 行为                                                       |
| -------------- | ---------------------------------------------------------- |
| **pre-commit** | `bun run lint`（全量 ESLint），失败则无法提交              |
| **commit-msg** | `commitlint` 校验 header 格式（见 `commitlint.config.js`） |

### 提交时注意

- **不要**把 `next-env.d.ts` 里 dev 专用路径（如 `.next/dev/types/...`）当作有意改动提交；该文件常由 `next dev` 自动改写
- 默认**不要**使用 `git commit --no-verify` 跳过校验
- 需要 Agent 按规范代提交时，可 @ [`.cursor/rules/git-commit-cn.mdc`](./.cursor/rules/git-commit-cn.mdc)

---

## 编写规范（给人与给 Agent）

日常实现请优先遵守仓库技能 **`tauri-next-coding-notes`**（路径：`.agents/skills/tauri-next-coding-notes/`）。下面是摘要；细节以技能内各 rule 为准。

### 1. Tauri Command（请求 / 响应）

适用：需要返回值、错误处理、或一次性调用的能力（读语言、改设置、打开工具等）。

必须同步改动的链路见 [tauri-command-chain.md](./.agents/skills/tauri-next-coding-notes/rules/tauri-command-chain.md)：

1. `src-tauri/src/cmd/*.rs`
2. `src-tauri/src/cmd/mod.rs`
3. `src-tauri/src/lib.rs` → `generate_handler!`
4. `src/cmd/types.ts` → `Cmd` 联合类型
5. `src/cmd/*.ts` → `invokeWrapper`

**不要**在业务代码里裸写 `invoke('xxx')`。

### 2. Tauri Event（广播 / 单向 / 跨窗）

适用：会话同步、modal 生命周期、前端写 Rust 日志、无需返回值的广播等。

| 方向        | Rust                                        | 前端                                                                |
| ----------- | ------------------------------------------- | ------------------------------------------------------------------- |
| Rust → 前端 | `src-tauri/src/events/emit.rs`              | `tauriOn` / `useTauriEventApi().on` / `cross-webview-sync` 全局订阅 |
| 前端 → Rust | `src-tauri/src/events/handlers/`            | `tauriEmit`（`src/utils/tauri-event.ts`）                           |
| 事件名      | `events/names.rs`                           | `src/config/window-events.ts`（**两处须一致**）                     |
| 载荷类型    | `events/payloads.rs`（部分 `#[typeshare]`） | `window-events.ts` 或 `@/generated/contracts`                       |

根布局已挂载 `TauriEventProvider`（内含 `CrossWebviewSyncSubscriptions`：会话 + 下载 Redux）。页面安装态用 `useToolsInstallStateSync`（`events/cross-webview-sync.ts`）。自定义监听可用 `useTauriEventApi()`。

完整约定见 [tauri-events.md](./.agents/skills/tauri-next-coding-notes/rules/tauri-events.md)。

### 3. Rust 分层

`cmd` 只做命令入口；跨 Webview 共享态在 `context/`；业务在 `utils/`；平台差异在 `utils/platform/{windows,macos}/`。  
Cursor 规则： [`.cursor/rules/tauri-rust-layering.mdc`](./.cursor/rules/tauri-rust-layering.mdc)

### 4. 其他强约束（技能内 rule）

| 主题                | 文件                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| i18n 与文案         | [i18n-and-copy.md](./.agents/skills/tauri-next-coding-notes/rules/i18n-and-copy.md)               |
| 主窗布局 / 防滚动条 | [layout-and-scroll.md](./.agents/skills/tauri-next-coding-notes/rules/layout-and-scroll.md)       |
| 标题栏拖拽区域      | [titlebar-drag-region.md](./.agents/skills/tauri-next-coding-notes/rules/titlebar-drag-region.md) |
| Redux 与副作用      | [state-and-effects.md](./.agents/skills/tauri-next-coding-notes/rules/state-and-effects.md)       |
| 日志与错误          | [logging-and-errors.md](./.agents/skills/tauri-next-coding-notes/rules/logging-and-errors.md)     |
| 提交前检查清单      | [preflight-checks.md](./.agents/skills/tauri-next-coding-notes/rules/preflight-checks.md)         |

### 5. 代码风格工具

- **ESLint**：`eslint.config` + `eslint-config-next`，提交前必跑
- **Prettier**：`bun run format` / `format:check`
- **TypeScript**：`bun run typecheck`

---

## Agent Skills 使用说明

技能位于 `.agents/skills/`，供 Cursor / Codex 等 Agent 在对应任务时**自动或手动加载**。下表说明「何时用哪个」。

| 技能                        | 路径                                      | 何时使用                                                                                      |
| --------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| **tauri-next-coding-notes** | `.agents/skills/tauri-next-coding-notes/` | **本仓库默认技能**：实现 Tauri 命令/事件、页面、Redux、i18n、标题栏、主窗布局、契约生成前必读 |
| **shadcn**                  | `.agents/skills/shadcn/`                  | 增删改 shadcn 组件、样式调试、`components.json` 相关                                          |
| **gsap-core**               | `.agents/skills/gsap-core/`               | 基础补间、easing、matchMedia                                                                  |
| **gsap-react**              | `.agents/skills/gsap-react/`              | React / Next 中 `useGSAP`、`gsap.context` 与卸载清理                                          |
| **gsap-timeline**           | `.agents/skills/gsap-timeline/`           | 时间轴编排、顺序动画                                                                          |
| **gsap-scrolltrigger**      | `.agents/skills/gsap-scrolltrigger/`      | 滚动驱动、pin、scrub（本应用主窗少用全局滚动，按需）                                          |
| **gsap-plugins**            | `.agents/skills/gsap-plugins/`            | ScrollTo、Flip、Draggable 等插件注册与用法                                                    |
| **gsap-performance**        | `.agents/skills/gsap-performance/`        | 动画卡顿、FPS 优化                                                                            |
| **gsap-utils**              | `.agents/skills/gsap-utils/`              | `gsap.utils` 数学/数组工具                                                                    |
| **gsap-frameworks**         | `.agents/skills/gsap-frameworks/`         | 非 React 框架（本仓库一般用 **gsap-react** 即可）                                             |

### 推荐组合

- **新功能（前后端）**：`tauri-next-coding-notes` → 判断走 Command 还是 Event → 改完跑 `bun run check`（+ `check:rust` / `check:contracts` 若涉及）
- **新 UI 组件**：`tauri-next-coding-notes`（布局/i18n）+ `shadcn`
- **下载进度 / 徽章动画**：`gsap-react` + `gsap-timeline`（必要时 `gsap-performance`）
- **代你 git commit**：@ `git-commit-cn` 规则（`.cursor/rules/git-commit-cn.mdc`），不要跳过 Husky

在对话中可显式引用：`@.agents/skills/tauri-next-coding-notes/SKILL.md`。

---

## IDE 建议

- [VS Code](https://code.visualstudio.com/) 或 Cursor
- 扩展：[Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)、[rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 相关文档

- [Tauri 2 文档](https://v2.tauri.app/)
- [Next.js 文档](https://nextjs.org/docs)
- 本仓库编码技能入口：[`.agents/skills/tauri-next-coding-notes/SKILL.md`](./.agents/skills/tauri-next-coding-notes/SKILL.md)
