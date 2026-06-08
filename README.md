# Mirror Agent Launcher

统一 CLI 智能体桌面管理工具。在一个窗口中管理多个命令行 AI 助手（Claude Code、CodeWhale 等），通过内嵌终端直接交互。

**当前阶段：v0.1beta — 核心功能开发中**

## 技术栈

- **桌面框架**：Electron
- **前端**：SolidJS + Tailwind CSS
- **终端**：xterm.js + node-pty
- **语言**：TypeScript

## 功能

- 多终端网格布局（1/2/3/4+ 自适应分屏）
- 内嵌 xterm.js 终端，支持完整 TUI
- 统一管理多个 CLI Agent，一键启动
- 配置持久化（读写各工具原生配置文件）
- 可扩展的 ConfigAdapter 体系（逐个适配 CLI 工具）
- 运行记录追踪（时长、Token）
- 实时日志系统

## 开发

```bash
# 安装依赖
npm install

# 启动开发（仅前端）
npm run dev

# 测试
npm test

# 构建
npm run build

# 启动 Electron（需先构建）
node_modules\electron\dist\electron.exe .
```

## 项目结构

```
mirror-agent-launcher/
├── main/                 # Electron 主进程
│   ├── adapters/         # ConfigAdapter 接口 + 实现
│   ├── pty/              # PTY 进程管理
│   ├── ipc/              # IPC 通道处理
│   └── runtime/          # 运行记录追踪
├── src/                  # 渲染进程（SolidJS）
│   ├── shell/            # 核心状态 + 基础组件
│   ├── extensions/       # 扩展模块（Sidebar、终端等）
│   ├── views/            # 主视图 + 设置页
│   └── bridge/           # IPC 客户端
└── docs/                 # 设计文档 + 规范
```
