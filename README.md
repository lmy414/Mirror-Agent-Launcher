# Mirror Agent Launcher

> **澪号 Agent** — 统一 CLI 智能体桌面管理启动器  
> Electron 桌面应用 · v0.1beta

一个统一的桌面终端，在一个窗口内管理多个命令行 AI 助手（Claude Code、Cursor CLI 等），通过内嵌 xterm.js 终端直接交互，支持多终端分屏、配置管理和运行追踪。

---

## 核心功能

### 多终端网格

动态自适应网格布局，支持同时运行多个 CLI Agent：

| 终端数 | 布局 |
|--------|------|
| 1 | 全屏 |
| 2 | 左右各半 |
| 3 | 三列平分 |
| 4+ | auto-fill 自适应 |

每个终端窗口独立运行，通过 PTY 伪终端与主进程通信，支持完整 TUI 程序（vim、htop、交互式 REPL 等）。

### CLI Agent 管理

侧边栏展示所有已安装/配置的 CLI 工具，一键启动终端会话：

- **自动检测** — 通过 ConfigAdapter 探测系统已安装的 CLI 工具
- **通用 Agent** — 手动添加任意命令行工具，指定启动命令和工作目录
- **配置持久化** — 读写各工具原生配置文件，跨 session 保持设置

### 配置适配器体系

```
main/adapters/
├── types.ts          # ConfigAdapter 接口
├── registry.ts       # 注册中心
├── claude-code.ts    # Claude Code 适配器
└── generic.ts        # 通用适配器（手动添加）
```

每个适配器实现统一接口：

| 方法 | 职责 |
|------|------|
| `detect()` | 探测工具是否已安装（不抛异常） |
| `read()` | 读取原生配置文件 |
| `write()` | 写入配置变更 |
| `validate()` | 逐字段校验，返回具体错误 |
| `getSchema()` | 提供配置表单 schema（动态表单渲染） |

新增 CLI 工具只需实现接口并注册，前端自动发现。

### IPC 通信架构

```
渲染进程                    主进程
─────────                  ─────────
ipc-client.ts  ←→  preload.ts (contextBridge)
                        ↓
                  ipc/config.ts    # config:list / config:read / config:write
                  ipc/agent.ts     # agent:spawn / agent:stop / agent:list
                  ipc/terminal.ts  # terminal:stdin / terminal:stdout / terminal:exit
                  ipc/settings.ts  # settings:get / settings:set
                        ↓
                  pty/manager.ts   # node-pty 进程生命周期
```

所有 IPC 消息带版本号 `v`，向前兼容扩展。

### 主题系统

CSS 变量驱动，5 套内置主题：

| 主题 | 强调色 |
|------|--------|
| 澪号暗蓝 | `#6B8FA8` |
| 翡翠绿 | `#5B8C5A` |
| 琥珀橙 | `#C8963E` |
| 樱花紫 | `#8B7FB8` |
| 石墨灰 | `#7A8B94` |

支持自定义强调色、玻璃面板色调、顶部标题栏颜色，所有设置持久化到 Electron store。

### 日志与追踪

- **实时日志** — 主进程聚合所有层级日志（main / renderer / pty:*），渲染进程实时推送/过滤
- **运行记录** — 追踪每个会话的启动时间、运行时长、退出状态和 Token 消耗
- **统一格式** — `[timestamp] [layer] [level] message { context }`

### UI 设计

- 玻璃拟态 (Glassmorphism) 风格 — 半透明面板 + 模糊背景
- 自定义无边框窗口 — Electron `frame: false` + 手写标题栏
- 窗口控制 — 最小化/最大化/关闭，支持拖拽
- 底部导航 — 终端 / 日志 / 设置三视图切换

---

## 路线图

> v0.1beta — 核心终端框架已就绪。以下为规划中的上层功能。

### 0.2 — 可视化配置中心

统一配置面板，告别手动编辑 JSON/YAML 配置文件：

- **Agent 配置** — 图形化编辑每个 CLI 工具的启动参数、环境变量、工作目录
- **配置模板** — 内置常用工具模板（Claude Code、Cursor、Codex），一键导入
- **配置校验** — 保存前实时校验，具体到每个字段的错误提示

### 0.3 — API Key & 模型管理

集中管理所有 CLI 工具的认证和模型偏好：

- **KeyChain 集成** — API Key 加密存储到系统凭证管理器
- **多 Provider 支持** — Anthropic / OpenAI / Google / 自定义 endpoint
- **模型切换** — 下拉选择模型 → 自动注入到各工具的启动环境变量
- **用量概览** — Token 消耗统计、按工具/日期聚合的成本图表

### 0.4 — Skills 技能管理

可视化管理 Claude Code / Codex 等工具的技能系统：

- **技能列表** — 浏览已安装的项目级/全局技能，启用/禁用
- **一键安装** — 拖入 `.zip` 技能包自动解压到对应目录
- **技能市场** — 浏览社区技能，一键下载安装（远期）

### 0.5 — MCP 协议集成

Model Context Protocol 工具的图形化管理：

- **MCP Server 配置** — 表单式添加/编辑 MCP Server（command + args + env）
- **工具预览** — 实时列出每个 MCP Server 暴露的工具及参数 schema
- **连接状态** — 显示每个 MCP Server 的运行状态、重连、错误日志
- **一键启停** — 独立控制每个 MCP Server 的启用/禁用

### 规划总览

```
v0.1 beta  ████████████  ✅ 终端框架、Agent 管理、IPC、主题、打包
v0.2       ░░░░░░░░░░░░  🔲 可视化配置中心
v0.3       ░░░░░░░░░░░░  🔲 API Key + 模型管理  
v0.4       ░░░░░░░░░░░░  🔲 Skills 技能管理
v0.5       ░░░░░░░░░░░░  🔲 MCP 协议集成
v1.0       ░░░░░░░░░░░░  🔲 全功能稳定版
```

---

## 快速开始

### 环境要求

- Node.js ≥ 18
- npm ≥ 9
- Windows 10+（当前仅支持 Windows）

### 开发

```bash
# 安装依赖
npm install

# 启动渲染进程开发服务器（仅前端，可用浏览器预览）
npm run dev

# 启动完整 Electron 开发环境（Vite + tsc + Electron）
npm run dev:electron

# 运行测试
npm test
```

### 构建

```bash
# 构建渲染进程 + 主进程
npm run build

# 生成 Windows .ico 图标（使用前需先运行此命令）
npm run icon

# 构建 + 打包 NSIS 安装程序
npm run build:electron
```

输出：`release/Mirror Agent Launcher Setup 0.0.1.exe`（一键安装）

---

## 项目结构

```
mirror-agent-launcher/
├── main/                        # Electron 主进程
│   ├── index.ts                 # 入口：窗口创建 + IPC 注册
│   ├── preload.ts               # contextBridge 安全暴露 API
│   ├── adapters/                # ConfigAdapter 实现
│   │   ├── types.ts             #   ConfigAdapter 接口定义
│   │   ├── registry.ts          #   注册中心
│   │   ├── claude-code.ts       #   Claude Code 适配器
│   │   └── generic.ts           #   通用适配器
│   ├── ipc/                     # IPC handler 注册
│   │   ├── config.ts            #   config:* 通道
│   │   ├── agent.ts             #   agent:* 通道
│   │   ├── terminal.ts          #   terminal:* 通道
│   │   └── settings.ts          #   settings:* 通道
│   ├── pty/
│   │   └── manager.ts           # PtyManager（node-pty 生命周期）
│   ├── store/
│   │   ├── app-state.ts         #   窗口状态持久化
│   │   └── settings.ts          #   显示设置持久化
│   ├── runtime/
│   │   └── tracker.ts           #   运行记录追踪
│   └── logger.ts                #   主进程日志
│
├── src/                         # 渲染进程（SolidJS）
│   ├── index.tsx                # 入口 + 扩展加载
│   ├── registry.ts              # Extension 注册中心
│   ├── shell/                   # 核心基础设施
│   │   ├── App.tsx              #   根布局（slot 驱动）
│   │   ├── App.css              #   全局样式 + CSS 变量
│   │   ├── app-state.ts         #   全局信号（Agent/终端/日志）
│   │   ├── theme.ts             #   主题体系（色值 + 切换）
│   │   └── nav-signal.ts        #   导航切换信号
│   ├── bridge/
│   │   └── ipc-client.ts        #   类型安全的 IPC 调用封装
│   ├── components/              # 通用 UI 组件
│   │   ├── glass-panel/         #   玻璃面板容器
│   │   ├── glass-input/         #   玻璃输入框
│   │   ├── color-picker/        #   颜色选择器（色板+HSV）
│   │   ├── toggle/              #   开关组件
│   │   ├── tab-bar/             #   标签栏
│   │   ├── badge/               #   徽标
│   │   ├── spinner/             #   加载动画
│   │   ├── progress-bar/        #   进度条
│   │   └── icon-button/         #   图标按钮
│   ├── extensions/              # 扩展模块
│   │   ├── sidebar/             #   Agent 侧边栏（工具列表+启动）
│   │   ├── terminal-view/       #   xterm.js 终端窗口
│   │   ├── mini-nav/            #   底部导航栏
│   │   └── title-bar/           #   自定义标题栏（窗口控制）
│   ├── views/                   # 主视图
│   │   ├── index.ts             #   视图注册到 slot
│   │   ├── PencilMainView.tsx   #   终端网格主视图
│   │   ├── SettingsLayoutView.tsx # 设置布局
│   │   ├── LogsView.tsx         #   实时日志查看器
│   │   ├── RuntimeView.tsx      #   运行记录视图
│   │   └── settings/            #   设置子页
│   │       ├── shared.tsx       #     共享组件与样式
│   │       ├── AgentConfigPage.tsx  # Agent 配置管理
│   │       ├── DisplayPage.tsx  #     显示/主题设置
│   │       └── SystemPage.tsx   #     系统信息
│   └── types/
│       └── electron.d.ts        #   window.electronAPI 类型声明
│
├── scripts/
│   └── generate-icon.mjs        # PNG → ICO 图标生成
│
├── public/                      # 静态资源
│   ├── icon.png                 # 应用图标源文件
│   ├── icon.ico                 # Windows 图标（生成产物）
│   ├── live2d/                  # Live2D 看板娘模型
│   ├── vendor/                  # 第三方库（Live2D SDK）
│   └── wallpapers/              # 默认壁纸
│
└── docs/                        # 文档
    ├── superpowers/             # 设计文档
    │   ├── specs/               #   规格书
    │   └── plans/               #   实现计划
    └── conventions/             # 工程规范
        ├── git.md
        ├── logging.md
        └── ipc-protocol.md
```

---

## 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 桌面框架 | Electron | 42 |
| 前端框架 | SolidJS | 1.8 |
| 终端引擎 | xterm.js + node-pty | 6.0 / 1.1 |
| 样式 | Tailwind CSS 3.4 + CSS 变量 | 3.4 |
| 构建 | Vite + tsc | 5.4 |
| 打包 | electron-builder (NSIS) | 26 |
| 测试 | Vitest | 4.1 |
| 图标 | lucide-solid | 1.17 |
| 语言 | TypeScript (strict) | 5.5 |

---

## 适配器开发

### 新增 CLI 工具适配

1. 创建 `main/adapters/<tool-name>.ts`，实现 `ConfigAdapter` 接口：

```typescript
import { ConfigAdapter } from './types'

export class MyToolAdapter implements ConfigAdapter {
  readonly toolId = 'my-tool'
  readonly displayName = 'My Tool'

  detect(): boolean {
    // 探测工具是否已安装，不抛异常
  }

  read(): { config: Record<string, unknown>; valid: boolean; errors: string[] } {
    // 读取原生配置文件
  }

  write(partial: Record<string, unknown>): { valid: boolean; errors: string[] } {
    // 合并写入配置，返回校验结果
  }

  validate(config: Record<string, unknown>): string[] {
    // 逐字段校验，返回错误列表
  }

  getSchema(): { sections: SchemaSection[] } {
    // 返回配置表单 schema（动态表单渲染）
  }
}
```

2. 在 `main/adapters/registry.ts` 注册：

```typescript
adapterRegistry.register(new MyToolAdapter())
```

3. 前端自动通过 `config:list` 发现新适配器，无需修改前端代码。

### 适配器约束

- 适配器之间零依赖 — 每个适配器独立工作
- `detect()` 不抛异常，只返回 `boolean`
- `read()` / `write()` 必须处理文件不存在的情况（首次使用）
- `validate()` 对每个字段给出具体错误信息，不做模糊校验
- `write()` 保留未知字段，不破坏用户手动编辑的内容

---

## 工程规范

AI 协作开发规范详见 [CLAUDE.md](CLAUDE.md)，核心原则：

- **样式抽离** — 禁止组件内联 style，统一走 CSS 变量
- **组件独立** — 组件间只通过 props/context/全局信号通信
- **300 行上限** — 超过强制拆分
- **IPC 版本化** — 所有协议带 `v` 字段，增量扩展
- **Conventional Commits** — `feat(scope): description`

---

## License

MIT
