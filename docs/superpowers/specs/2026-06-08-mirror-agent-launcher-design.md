# Mirror Agent Launcher — 设计规格书

> 状态: 待审阅  
> 日期: 2026-06-08  
> 目标: 将现有"澪号 MIO Terminal"改造为基于 Electron 的统一 CLI Agent 管理启动器

---

## 1. 项目目标

构建一个 **桌面应用（EXE）**，统一管理和运行多个 CLI 智能体工具（Claude Code、CodeWhale、OpenClaw 等）。核心能力：

- 通过内嵌终端（xterm.js）与各个 CLI Agent 直接交互
- 主界面同时展示多个终端窗口，支持 Tab/Grid 切换
- 通过设置界面读写各工具的原生配置文件，不自行存储数据
- 终端 UI 风格统一（玻璃拟态暗色主题），不影响底层 CLI 行为
- 逐个适配 CLI 工具，架构支持增量扩展

---

## 2. 技术栈

| 层 | 选择 | 理由 |
|---|------|------|
| 桌面框架 | **Electron** | Node.js 完整能力、文件系统访问、PTY 支持、打包 EXE 成熟 |
| 终端引擎 | **node-pty** + **xterm.js** | 真实 PTY 伪终端，替换原有 child_process.spawn |
| 前端框架 | **SolidJS** (保留) | 现有代码已使用，组件生态完整 |
| 样式 | **Tailwind CSS** (保留) | 现有主题系统无需改动 |
| 通信 | Electron IPC (contextBridge) | 替换原有 WebSocket |
| 打包 | electron-builder | 输出单 EXE + 安装包 |

---

## 3. 架构分层

```
┌─ Renderer Process (SolidJS + xterm.js) ──────────────┐
│                                                        │
│  保留: registry / App / 主题 / 组件库                  │
│  改造: 终端视图 / 侧边栏 / 设置页 / 日志页            │
│  删除: use-ws.ts (WebSocket → IPC)                     │
│                                                        │
│  ┌─ IPC Bridge (preload.ts) ────────────────────────┐ │
│  │  暴露 window.electronAPI 给渲染进程              │ │
│  │  - agent:list / agent:spawn / agent:stop          │ │
│  │  - config:read / config:write / config:schema     │ │
│  │  - terminal:stdin / terminal:stdout (per agent)   │ │
│  │  - terminal:resize / terminal:kill                │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
                         │ IPC
┌─ Main Process (Node.js) ─────────────────────────────┐
│                                                        │
│  ┌─ ConfigAdapterRegistry ──────────────────────────┐ │
│  │  register(adapter: ConfigAdapter)                 │ │
│  │  get(toolId): ConfigAdapter                       │ │
│  │  discover(): 扫描已安装工具                       │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ PtyManager ────────────────────────────────────┐ │
│  │  spawn(config) → sessionId                        │ │
│  │  write(sessionId, data)                           │ │
│  │  resize(sessionId, cols, rows)                    │ │
│  │  kill(sessionId)                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ WindowManager ─────────────────────────────────┐ │
│  │  窗口创建 / 尺寸记忆 / 单实例锁                  │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 与现有代码的关系

| 保留 | 改造 | 删除 | 新增 |
|------|------|------|------|
| registry.ts | Sidebar.tsx (去硬编码) | use-ws.ts (WebSocket) | main/ (整个主进程) |
| App.tsx | SettingsLayoutView.tsx (动态表单) | terminal-server/ (迁移进主进程) | preload.ts |
| App.css | PencilMainView.tsx (端子网格→IPC) | useAgent.tsx (精简) | 各 ConfigAdapter |
| 组件库 | LogsView.tsx (去假数据) | bridge 协议引用 | |
| 主题系统 | MiniNav.tsx | | |
| | TopMenuBar.tsx | | |

---

## 4. ConfigAdapter 接口（核心抽象）

### 4.1 接口定义

每个 CLI 工具通过实现 `ConfigAdapter` 接口接入：

```typescript
interface ConfigField {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'path'
  description?: string
  defaultValue: unknown
  required: boolean
  options?: { label: string; value: string }[]   // type=select 时
  placeholder?: string
}

interface ConfigSection {
  id: string
  label: string
  description?: string
  fields: ConfigField[]
}

interface ConfigAdapter {
  toolId: string
  displayName: string

  /** 向前端提供动态表单 schema */
  getConfigSchema(): ConfigSection[]

  /** 自动检测工具是否已安装 */
  detect(): boolean

  /** 读取原生配置文件，返回展平后的 key-value */
  read(): Record<string, unknown>

  /**
   * 写入配置（部分更新）。适配器内部负责：
   * 1. 读取当前原生配置文件
   * 2. 将展平 key 映射回原生格式
   * 3. 深度 merge 到当前配置
   * 4. 写回原生配置文件
   */
  write(partialConfig: Record<string, unknown>): void

  /** 校验配置合法性 */
  validate(config: Record<string, unknown>): { valid: boolean; errors: string[] }

  /** 返回启动命令 */
  getCommand(config: Record<string, unknown>): {
    command: string
    args: string[]
    cwd: string
    env: Record<string, string>
  }
}
```

### 4.2 适配器示例：ClaudeCodeAdapter

| 属性 | 值 |
|------|-----|
| toolId | `claude-code` |
| 配置文件 | `~/.claude/settings.json` |
| 检测方式 | 执行 `claude --version` 返回成功 |
| 启动命令 | `claude`，cwd 为用户指定的工作目录 |

`read()` 读 `~/.claude/settings.json`，将嵌套 JSON 展平为 `{ "model": "claude-opus-4-8", "apiKeyHelper": "...", ... }`  
`write()` 将展平配置还原为原生 JSON 结构写回。

### 4.3 后续适配器

| 适配器 | 预估工作量 | 原生配置格式 |
|--------|-----------|-------------|
| CodeWhaleAdapter | 待确认（取决于 CodeWhale 配置方式） | 待确认 |
| OpenClawAdapter | 待确认 | 待确认 |
| 自定义脚本 (GenericAdapter) | 小 | 自定义 JSON + 可配置启动命令 |

### 4.4 通用适配器（GenericAdapter）

为不支持检测的用户自定义脚本/工具提供一个通用适配器：

- toolId: 用户自定义 ID
- 配置: 启动命令 + 工作目录 + 环境变量（表单固定字段，不映射到外部配置文件）
- 检测: 永远返回 false，需手动添加
- 用途: 覆盖任意未适配 CLI 工具

---

## 5. PTY 进程管理

### 5.1 PtyManager

```typescript
interface PtySession {
  id: string
  agentId: string
  pty: IPty            // node-pty 实例
  config: AgentConfig
  startedAt: number
}

class PtyManager {
  private sessions = new Map<string, PtySession>()

  spawn(agentConfig: AgentConfig): PtySession
  write(sessionId: string, data: string): void
  resize(sessionId: string, cols: number, rows: number): void
  kill(sessionId: string): void
  killAll(): void
  list(): PtySession[]
}
```

### 5.2 生命周期

```
用户点击 "新建终端" (Sidebar)
  → IPC: agent:spawn
  → PtyManager.spawn(agentConfig)
  → node-pty.spawn(command, args, { cwd, env, cols, rows })
  → IPC: terminal:<sessionId>:stdout (流式推送)
  → xterm.write(data)
  
用户按键
  → xterm.onData → IPC: terminal:<sessionId>:stdin
  → pty.write(data)

用户关闭终端 / 进程退出
  → pty.onExit → IPC: terminal:<sessionId>:exit
  → 更新标题栏状态点
```

### 5.3 与原有 terminal-server 的差异

| | terminal-server (旧) | PtyManager (新) |
|---|---|---|
| 进程模型 | 独立 Node 进程，WebSocket 通信 | Electron 主进程内，IPC 通信 |
| 终端类型 | child_process.spawn（无 PTY） | node-pty（真实伪终端） |
| TUI 支持 | 差（ANSI 转义序列不完整） | 好（完整 PTY，支持所有 TUI 程序） |
| 窗口调整 | 不支持 | pty.resize() |

---

## 6. 终端 UI 主题

### 6.1 原则

xterm.js 主题完全独立于 CLI 进程。CLI 工具不感知终端的视觉风格，只收发字符流。

### 6.2 默认主题

```typescript
const terminalTheme: ITheme = {
  background: 'rgba(0, 0, 0, 0.60)',      // 继承玻璃底色
  foreground: '#d0d0d8',                    // 文本色
  cursor: '#6b8fa8',                       // 跟随 accent
  cursorAccent: '#000000',
  selectionBackground: 'rgba(107, 143, 168, 0.30)',
  // ANSI 16 色盘从全局主题变量派生
}
```

终端窗口容器应用 `backdrop-filter: blur(12px)` 实现磨砂玻璃效果。

### 6.3 扩展

终端字体默认 `JetBrains Mono`，字号 13px。未来可通过设置页自定义。

---

## 7. 前端改动清单

### 7.1 不再需要的模块

- `src/shell/use-ws.ts` — WebSocket 连接管理 → Electron IPC 替代
- `src/shell/useAgent.tsx` — 原有 LLM session 状态 → 精简为 AppState
- `src/shell/char-pump.ts` — 流式文本动画 → 不适用
- `src/shell/use-session-cache.ts` — session 缓存 → 不适用
- `src/shell/use-agents.ts` — Agent 管理 → IPC 调用替代
- `src/shell/use-settings.ts` — settings → IPC config:* 替代

### 7.2 改造的文件

| 文件 | 改动 |
|------|------|
| `src/extensions/sidebar/Sidebar.tsx` | 硬编码 Agent 列表 → `useIPC('agent:list')` |
| `src/views/SettingsLayoutView.tsx` | 硬编码表单 → `ConfigAdapter.getConfigSchema()` 驱动的动态表单 |
| `src/views/LogsView.tsx` | 假数据 → 主进程推送的真实日志 |
| `src/views/PencilMainView.tsx` | WebSocket 终端 → IPC 终端通道 |
| `src/extensions/terminal-view/TerminalView.tsx` | ws.send() → window.electronAPI.terminalStdin() |
| `src/shell/App.tsx` | 保留布局逻辑，去掉 WebSocket 连接状态 |

### 7.3 新增的前端模块

| 文件 | 功能 |
|------|------|
| `src/bridge/ipc-client.ts` | 封装 `window.electronAPI`，提供类型安全的 IPC 调用 |
| `src/shell/app-state.ts` | 精简的全局状态管理（替换 useAgent.tsx） |
| `src/components/dynamic-form/` | 动态表单组件（ConfigSection → 折叠面板，ConfigField → 控件） |

---

## 8. 主进程文件结构

```
main/
├── index.ts                  # 入口，启动窗口 + 注册 IPC handlers
├── preload.ts                # contextBridge 暴露 API
├── adapters/
│   ├── types.ts              # ConfigAdapter 接口定义
│   ├── registry.ts           # ConfigAdapterRegistry
│   ├── claude-code.ts        # ClaudeCodeAdapter
│   ├── generic.ts            # GenericAdapter（自定义脚本）
│   └── (future: codewhale.ts, openclaw.ts, ...)
├── pty/
│   └── manager.ts            # PtyManager
├── ipc/
│   ├── config.ts             # config:* IPC handlers
│   ├── agent.ts              # agent:* IPC handlers
│   └── terminal.ts           # terminal:* IPC handlers
├── window/
│   └── manager.ts            # 窗口创建/尺寸持久化
└── store/
    └── app-state.ts          # 布局/窗口状态持久化到本地 JSON
```

---

## 9. IPC 协议

### 9.1 配置操作

```
config:list     → 返回所有已注册适配器的 toolId + displayName + detect 结果
config:read     { toolId } → { config }
config:write    { toolId, partialConfig } → { success, errors? }   (适配器内部 read-merge-write)
config:schema   { toolId } → { sections }
```

### 9.2 Agent 操作

```
agent:spawn     { toolId } → { sessionId }
agent:stop      { sessionId } → { success }
agent:restart   { sessionId } → { sessionId: new }
agent:list      → { running: [{ sessionId, toolId, startedAt, pid }] }
```

### 9.3 终端 I/O

```
terminal:stdin   { sessionId, data } →
terminal:stdout  ← { sessionId, data }
terminal:resize  { sessionId, cols, rows } →
terminal:exit    ← { sessionId, exitCode, signal }
```

---

## 10. 错误处理

| 场景 | 主进程行为 | 前端表现 |
|------|-----------|----------|
| `detect()` 失败 | 标记 agent 为 `not-installed` | 显示"未检测到安装"，提供手动配置 |
| `read()` 配置文件损坏 | 返回 `{ valid: false, errors }` | 表单内联错误提示 |
| `write()` 权限不足 | 抛 ENOPERM | toast "写入失败：权限不足" |
| PTY 进程异常退出 | 推送 exit 事件 | 标题栏状态点变红，终端显示退出码 |
| `spawn()` 命令找不到 | 错误消息 push 到 stdout | 终端显示 "command not found" |
| IPC 超时 | — | 前端显示断连遮罩 + 自动重连 |

---

## 11. 打包与发布

- 使用 **electron-builder** 打包 Windows EXE
- 目标: 单文件 portable + NSIS 安装包
- 包含 Live2D 模型资产（public/live2d/）
- 首次启动自动检测已安装 CLI 工具

---

## 12. 成功标准

1. 启动应用 → Sidebar 显示已检测到的 CLI 工具列表
2. 点击 "新建终端" → 打开 xterm 终端，运行对应 CLI 工具
3. 同时运行 3+ 终端 → Tab/Grid 切换流畅
4. 设置页修改 Claude Code 配置 → `~/.claude/settings.json` 正确更新
5. 关闭应用 → 下次启动恢复到上次的 Agent 配置和窗口位置
