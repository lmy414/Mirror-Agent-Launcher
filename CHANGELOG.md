# Changelog

## v0.1.1 (2026-06-09) — 工作目录管理 + 适配器架构重构

### 🐛 Bug 修复
- **启动崩溃**: `app.getPath()` 和 `app.isPackaged` 改为延迟求值，兼容 Electron 42 (Node 24) breaking changes (`main/store/settings.ts`, `main/index.ts`)
- **终端白屏**: PTY 环境变量从白名单最小集扩展为安全系统变量集，确保 Claude Code 能找到 HOME/USERPROFILE 等必需变量 (`main/adapters/claude-code/`, `main/adapters/generic/`)
- **终端数据丢失**: 修复竞态条件 — PTY 输出先于 TerminalWindow onMount 到达导致数据丢失。模块级全局缓冲区 + Portal 挂载 (`src/extensions/terminal-view/TerminalView.tsx`)
- **设置页渲染失败**: 修复 `SettingsLayoutView` 缺失 `For` 导入，解决 For 和隐式 any 编译错误
- **Agent 配置面板空白**: 清除陈旧编译产物 `dist-electron/adapters/claude-code.js`，该文件优先于新 `claude-code/index.js` 被加载

### ✨ 新增
- **工作目录管理**: 设置页新增独立 Tab「工作目录」，支持添加/删除/编辑常用目录，持久化到 Electron store (`src/views/settings/WorkingDirPage.tsx`, `WorkingDirSection.tsx`)
- **新建终端目录选择器**: Agent 开启「询问工作目录」后，新建终端弹出居中选择器，支持从配置列表选择 / 浏览文件夹 / 手动输入 (`src/components/working-dir-picker/`)
- **Agent 配置页重构**: 双栏布局 — 左侧已安装/已适配 CLI 工具列表，右侧动态表单详情面板 (`src/views/settings/AgentConfigPage.tsx`, `AgentDetailPanel.tsx`)
- **Provider 架构**: 适配器支持多厂商插件系统 — 新增 `ProviderConfig` 接口，Claude Code 支持 Anthropic (原生) / DeepSeek 双厂商，每厂商独立模型列表和表单 schema (`main/adapters/claude-code/providers/`)
- **DeepSeek 适配**: 完整支持 CLAUDE_CODE_EFFORT_LEVEL、模型映射 (Opus/Sonnet/Haiku)、双认证方式 (Bearer/X-Api-Key) (`main/adapters/claude-code/providers/deepseek/`)
- **查看原始配置**: Agent 详情页「查看原始配置」按钮 → 系统编辑器打开 `~/.claude/settings.json`（IPC: `config:openFile` + `shell.openPath`）
- **系统文件夹选择器**: IPC: `dialog:openDirectory` → Electron `dialog.showOpenDialog({ openDirectory })`
- **Agent spawn 支持 cwd 覆盖**: `agent:spawn` 接受 `cwd` 参数，前端选目录后直接注入 (`main/ipc/agent.ts`)
- **回归调试技能**: 融合 `regression-debugging` + `electron-ipc-sync`，新增七步法 (STOP→DIFF→TRACE→VISUALIZE→ANALYZE→FIX→VERIFY) (`.agents/skills/regression-debugging/SKILL.md`)

### 🔧 优化
- **安全加固**: 新增输入校验 `main/utils/validation.ts` — validateToolId / validateCommand / validateCwd，防止路径遍历和 RCE
- **定向 sender**: PTY 数据从全窗口广播改为只发给创建者 WebContents，防止信息泄露 (`main/pty/manager.ts` → `sessionOwners`)
- **日志隔离**: `main/logger.ts` 维护 subscribers 集合，日志只发给已订阅窗口
- **窗口状态防抖**: `saveWindowState` 增加 300ms 防抖，异步写入避免阻塞主进程
- **开发脚本**: 新增 `dev:fast` — 跳过 tsc 编译，热启动仅 Vite + Electron
- **asar 解包**: 添加 `asarUnpack: ["node_modules/node-pty/**/*.node"]`，确保 .node 二进制运行时可用
- **适配器目录化**: `claude-code`/`generic` 从单文件移入文件夹，为 provider 插件化铺路

### 📝 文档
- 开发计划书 (`docs/roadmap.md`): 近期/中期/长期三阶段规划 + Bug 清单 + 版本路线图
- 更新 README 架构说明

### 🧪 测试
- ipc-client 测试补充 `dialog` / `config.openFile` / `config.providers` mock

---

## 项目当前进度

| 模块 | 状态 | 说明 |
|------|------|------|
| Electron 框架 | ✅ 稳定 | 窗口管理、IPC、preload、打包 |
| PTY 终端 | ✅ 可用 | node-pty + xterm.js、多终端网格、竞态修复 |
| Agent 管理 | ✅ 重构完成 | 双栏布局、Provider 架构、DeepSeek 适配 |
| 工作目录 | ✅ 完成 | 全局目录 CRUD + 弹窗选择器 + 上次记忆 |
| 主题系统 | ✅ 稳定 | 5 套主题、自定义 accent、玻璃色调、壁纸 |
| 日志追踪 | ✅ 稳定 | 分层日志、运行记录、定向推送 |
| 安全加固 | ✅ 完成 | 输入校验、定向 sender、最小环境变量 |
| 配置中心 | 🟡 基础完成 | Provider 动态表单，待扩展更多适配器 |
| Skills 管理 | 🔲 未开始 | 计划 v0.4 |
| MCP 集成 | 🔲 未开始 | 计划 v0.5 |
| 跨平台 | 🔲 未开始 | 计划 v1.0 |
| 测试覆盖 | 🟡 基础 | 核心适配器 + IPC 客户端，待补充 PTY 集成测试 |
