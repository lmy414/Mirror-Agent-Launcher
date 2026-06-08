# Mirror Agent Launcher — 工程规范

> 澪号 Agent · Electron 桌面应用 · 统一 CLI Agent 管理启动器

---

## 0. 核心准则

| # | 准则 | 说明 |
|---|------|------|
| 0.1 | **样式统一抽离** | 禁止组件内联 `style` 对象。所有样式走 CSS 变量体系（`theme.ts` 定义变量键名，`.css` 文件消费变量） |
| 0.2 | **组件独立** | 每个 UI 组件只负责自身逻辑，不 import 其他组件的内部状态、hooks、或模块私有导出。组件间通过 props / context / 全局信号通信 |
| 0.3 | **300 行上限** | 单文件超过 300 行 → 拆分。拆分方式：`Component.tsx` + `Component/SubFeature.tsx` + `utils.ts` |
| 0.4 | **Git 规范** | Conventional Commits，详见 [docs/conventions/git.md](docs/conventions/git.md) |
| 0.5 | **日志规范** | 统一格式 `[layer] [level] message`，主进程聚合所有日志，详见 [docs/conventions/logging.md](docs/conventions/logging.md) |
| 0.6 | **协议可扩展** | 所有 IPC 协议带版本号 `v`，新增字段不 break 旧逻辑，详见 [docs/conventions/ipc-protocol.md](docs/conventions/ipc-protocol.md) |
| 0.7 | **适配器增量扩展** | 新增 CLI 工具 → 实现 `ConfigAdapter` 接口 → 注册到 `ConfigAdapterRegistry`。适配器之间零依赖 |

---

## 1. 技术栈

| 层 | 技术 |
|----|------|
| 桌面框架 | Electron |
| 终端引擎 | node-pty + xterm.js |
| 前端框架 | SolidJS + TypeScript strict mode |
| 样式 | Tailwind CSS 3.4 + CSS 变量体系 |
| 构建 | Vite (渲染进程) + tsc (主进程) |
| 通信 | Electron IPC (contextBridge + ipcRenderer/ipcMain) |
| 打包 | electron-builder → 单 EXE |

---

## 2. 项目结构

```
mirror-agent-launcher/
├── CLAUDE.md                    # ← 你在这里
├── package.json
├── index.html                   # 入口 HTML
├── vite.config.ts               # Vite 配置
├── tsconfig.json                # TypeScript 配置
├── tailwind.config.ts           # Tailwind 配置
│
├── main/                        # Electron 主进程
│   ├── index.ts                 # 入口：窗口创建 + IPC 注册
│   ├── preload.ts               # contextBridge API
│   ├── adapters/                # ConfigAdapter 实现
│   │   ├── types.ts             #   ConfigAdapter 接口定义
│   │   ├── registry.ts          #   ConfigAdapterRegistry
│   │   ├── claude-code.ts       #   ClaudeCodeAdapter
│   │   └── generic.ts           #   GenericAdapter
│   ├── pty/
│   │   └── manager.ts           # PtyManager（进程生命周期）
│   ├── ipc/                     # IPC handler 注册
│   │   ├── config.ts            #   config:* 通道
│   │   ├── agent.ts             #   agent:* 通道
│   │   └── terminal.ts          #   terminal:* 通道
│   ├── window/
│   │   └── manager.ts           # 窗口管理
│   ├── store/
│   │   └── app-state.ts         # 布局/窗口状态持久化
│   └── logger.ts                # 主进程日志
│
├── src/                         # 渲染进程（SolidJS）— 主进程不可直接引用
│   ├── index.tsx                # 入口
│   ├── registry.ts              # Extension 注册中心（保留）
│   ├── shell/                   # 核心状态 + 基础设施
│   │   ├── App.tsx              #   根布局
│   │   ├── App.css              #   全局样式 + CSS 变量定义
│   │   ├── app-state.ts         #   全局状态（替代 useAgent.tsx）
│   │   ├── theme.ts             #   主题系统（CSS 变量键名 + 色值）
│   │   └── nav-signal.ts        #   导航信号（保留）
│   ├── bridge/
│   │   └── ipc-client.ts        #   类型安全的 IPC 调用封装
│   ├── components/              # 通用 UI 组件（<300 行/件）
│   │   ├── glass-panel/         #   玻璃面板
│   │   ├── toggle/              #   开关
│   │   ├── dynamic-form/        #   动态表单
│   │   └── ...
│   ├── extensions/              # 扩展模块
│   │   ├── mini-nav/            #   底部导航栏
│   │   ├── sidebar/             #   Agent 侧边栏
│   │   ├── terminal-view/       #   终端窗口渲染
│   │   └── top-menu/            #   顶部菜单
│   ├── views/                   # 主视图
│   │   ├── PencilMainView.tsx   #   ← 将重命名为 TerminalGridView
│   │   ├── SettingsLayoutView.tsx
│   │   └── LogsView.tsx
│   └── styles/                  # 全局样式库
│       ├── tokens.css           #   CSS 自定义属性（从 theme.ts 生成）
│       ├── glass.css            #   玻璃拟态通用样式
│       └── typography.css       #   字体排版
│
├── public/
│   └── live2d/                  # Live2D 模型资产
│
└── docs/
    ├── superpowers/
    │   └── specs/               # 设计规格书
    └── conventions/             # 工程规范
        ├── git.md
        ├── logging.md
        └── ipc-protocol.md
```

---

## 3. 样式规范

### 3.1 规则

> **组件文件中禁止出现 `style={{ ... }}` 形式的 Inline CSS。**  
> 唯一例外：通过 JS 动态计算的值（如 `width: ${cols * 8}px`），且不超过 3 个属性。

### 3.2 CSS 变量体系

所有颜色、间距、字体走 CSS 自定义属性，定义在 `src/styles/tokens.css`：

```css
:root {
  /* 由 theme.ts 动态注入 */
  --accent: #6b8fa8;
  --accent-rgb: 107, 143, 168;
  --text-primary: #e8e8f0;
  --text-secondary: #a0a0b0;
  --text-muted: #606078;
  --success: #5b8c5a;
  --warning: #c8963e;
  --error: #e0555a;
  --glass-tint-rgb: 0, 0, 0;
  --top-bar-tint-rgb: 0, 0, 0;
  --card-bg: rgba(255, 255, 255, 0.03);
}
```

### 3.3 组件样式

每个组件对应一个同名的 `.css` 文件，使用 BEM-like 命名：

```
components/glass-panel/
├── index.tsx          # 组件逻辑
└── index.css          # 组件样式（.glass-panel {}, .glass-panel__header {}）
```

```css
/* Good */
.glass-panel {
  background: rgba(var(--glass-tint-rgb), 0.60);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
```

### 3.4 主题系统

`theme.ts` 负责：
- 定义主题色值（`THEMES` 数组）
- 将选中主题的色值写入 `document.documentElement.style.setProperty('--accent', ...)`
- 持久化用户选择到 Electron 主进程 store

新增主题只需在 `THEMES` 数组追加一项。

---

## 4. 组件规范

### 4.1 独立性

每个组件文件 **只能依赖**：
- SolidJS 内置（`createSignal`, `For`, `Show`, `onMount` 等）
- 自身子目录下的私有模块（`./utils.ts`，`./SubComponent.tsx`）
- `src/bridge/ipc-client.ts`（统一 IPC 通道）
- `src/shell/app-state.ts`（全局状态）
- `src/shell/theme.ts`（主题信号）
- `src/components/` 下的通用组件

**禁止依赖**：
- 其他组件的内部状态、hooks、或模块私有导出
- 其他扩展（`extensions/`）的内部实现

### 4.2 文件行数

| 行数 | 动作 |
|------|------|
| ≤300 | ✅ 正常 |
| 301-400 | ⚠️ 考虑拆分，加注释说明为何不拆 |
| >400 | ❌ 强制拆分 |

拆分方式：提取纯逻辑到 `utils.ts`，提取子视图到独立文件。

### 4.3 Props 类型

所有组件 Props 必须定义显式 interface，不允许 `any` 或 `Record<string, unknown>`：

```typescript
// Good
interface TerminalWindowProps {
  sessionId: string
  onStdin: (data: string) => void
  onClose: () => void
}

// Bad — 不允许
function TerminalWindow(props: any) { ... }
```

---

## 5. Git 规范

详见 [docs/conventions/git.md](docs/conventions/git.md)

### 概要

| 项 | 规范 |
|----|------|
| Commit 格式 | Conventional Commits: `type(scope): description` |
| 分支命名 | `feat/<feature-name>` / `fix/<bug-name>` / `refactor/<scope>` |
| PR/MR | 每个功能一个分支，合并前 squash |

### Type 定义

| Type | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `refactor` | 重构（不改功能） |
| `style` | 样式变更 |
| `docs` | 文档 |
| `chore` | 构建/工具配置 |

---

## 6. 日志规范

详见 [docs/conventions/logging.md](docs/conventions/logging.md)

### 概要

统一格式：

```
[timestamp] [layer] [level] message { context }
```

| layer | 示例 |
|-------|------|
| `main` | Electron 主进程 |
| `renderer` | 渲染进程 |
| `pty:<agentId>` | PTY 会话 |

| level | 含义 |
|-------|------|
| `INFO` | 正常操作（配置读写成功、进程启动） |
| `WARN` | 可恢复异常（重试、降级） |
| `ERROR` | 不可恢复错误（进程崩溃、文件损坏） |

每条日志必须包含 **变更意图**（为什么做）和 **受影响内容**（改了什么）。

---

## 7. IPC 协议规范

详见 [docs/conventions/ipc-protocol.md](docs/conventions/ipc-protocol.md)

### 概要

所有 IPC 消息必须包含 `v` 字段（协议版本，当前 `1`）：

```typescript
interface IpcMessage<T = unknown> {
  v: number          // 协议版本
  type: string       // 通道名，如 "config:write"
  payload: T         // 载荷
  ts: number         // Unix 毫秒时间戳
}
```

### 通道命名

```
<domain>:<action>
```

| Domain | 用途 |
|--------|------|
| `config` | 配置读写 |
| `agent` | Agent 进程管理 |
| `terminal` | 终端 I/O |
| `window` | 窗口操作 |
| `log` | 日志推送 |

### 扩展规则

1. 新增字段 → 递增 `v` 小版本号，旧 consumer 忽略未知字段
2. 删除/重命名字段 → 递增 `v` 主版本号，旧 consumer 需适配
3. 新增通道 → 只需注册 handler，不 break 已有逻辑

---

## 8. 适配器规范

### 8.1 接口

所有 CLI 工具适配器实现 `ConfigAdapter` 接口（定义在 `main/adapters/types.ts`）。

### 8.2 新增适配器步骤

1. 创建 `main/adapters/<tool-name>.ts`
2. 实现 `ConfigAdapter` 全部方法
3. 在 `main/adapters/registry.ts` 注册
4. 前端自动通过 `config:list` 发现新适配器

### 8.3 适配器约束

- 适配器之间零依赖
- `read()` / `write()` 必须处理文件不存在的情况
- `detect()` 不抛异常，只返回 `boolean`
- `validate()` 必须对每个字段给出具体错误信息
