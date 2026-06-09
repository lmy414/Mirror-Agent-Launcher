# Mirror Agent Launcher — 开发计划书

> 澪号 Agent · v0.1beta → v1.0  
> 发布节奏：每周一个小版本（0.1.1, 0.1.2, ... → 0.2.0 → ... → 1.0.0）

---

## 版本号规则

```
主版本.次版本.修订号

修订号递增：Bug 修复、小优化（每周例行发布）
次版本递增：新功能模块完成（参照下方里程碑）
主版本递增：架构级变更、全功能稳定
```

---

## 一、近期计划（v0.1.x — 核心稳固与体验打磨）

> **目标**：将 v0.1beta 推进到可日常使用的稳定版本。  
> **策略**：修 Bug → 补测试 → 代码规范 → 小体验迭代。

### 1.1 BUG 修复

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| B01 | **CLAUDE.md 规范违反：全组件 Inline Style** | 高 | [PencilMainView.tsx](src/views/PencilMainView.tsx)、[Sidebar.tsx](src/extensions/sidebar/Sidebar.tsx)、[TerminalView.tsx](src/extensions/terminal-view/TerminalView.tsx)、[RuntimeView.tsx](src/views/RuntimeView.tsx)、[LogsView.tsx](src/views/LogsView.tsx)、[AgentConfigPage.tsx](src/views/settings/AgentConfigPage.tsx)、[DisplayPage.tsx](src/views/settings/DisplayPage.tsx)、[SystemPage.tsx](src/views/settings/SystemPage.tsx)、[SettingsLayoutView.tsx](src/views/SettingsLayoutView.tsx) 等文件中大量使用 `style={{...}}` 内联样式，违反 CLAUDE.md 0.1 规则「样式统一抽离，禁止组件内联 style」。需逐一迁移到 `.css` 文件 |
| B02 | **AgentConfigPage 编辑不持久化** | 高 | 修改 Agent 的 command/cwd 后未调用 `configWrite()`，刷新即丢失 |
| B03 | **终端退出后无自动重连** | 中 | 进程异常退出后，终端窗口变为死窗口，用户需手动关闭再新建 |
| B04 | **Token 解析正则匹配不完整** | 中 | [tracker.ts](main/runtime/tracker.ts) 的 token 解析仅匹配 `input:`/`output:` 前缀，Claude Code 等工具的 "Tokens: 12k total (4.5k in, 7.5k out)" 格式无法正确解析 |
| B05 | **xterm.js 双重依赖** | 中 | [package.json](package.json) 同时依赖 `@xterm/xterm@^6.0.0` 和 `xterm@^5.3.0`，后者为冗余旧版本 |
| B06 | **ResizeObserver 可能在组件卸载后触发** | 低 | [TerminalView.tsx](src/extensions/terminal-view/TerminalView.tsx) 中 `onCleanup` 先取消订阅再断开 observer，顺序应调换 |
| B07 | **PTY 进程泄漏** | 中 | 窗口强制关闭时 `killAll()` 未被调用，node-pty 子进程可能残留 |
| B08 | **非 Windows 平台 `claude` vs `claude.cmd` 判断** | 低 | [claude-code.ts](main/adapters/claude-code.ts) 仅判断 `win32`，Linux/macOS 上 `claude.cmd` 不存在但未回退到 `which claude` |
| B09 | **Sidebar 运行记录与 RuntimeView 数据重复渲染** | 低 | 两个组件各自订阅 `onRuntimeUpdate`，每次更新触发两处重渲染 |
| B10 | **壁纸 Data URL 过大导致 settings store 膨胀** | 中 | [DisplayPage.tsx](src/views/settings/DisplayPage.tsx) 将壁纸以 Base64 Data URL 存入 Electron store，大图片会导致设置文件 >10MB |

### 1.2 测试补全

| # | 项 | 说明 |
|---|-----|------|
| T01 | **PtyManager 集成测试** | 启动/写入/退出/多会话并发 |
| T02 | **IPC handler 契约测试** | 每个通道的 ok/error 路径 |
| T03 | **ConfigAdapter 边界测试** | 文件不存在、JSON 损坏、权限拒绝 |
| T04 | **RuntimeTracker 边界测试** | 重复 start、未 start 即 end、空 feed |
| T05 | **渲染进程组件测试** | Sidebar、TerminalView、SettingsLayoutView |
| T06 | **windowsPtyAgent 兼容性测试** | Win10/Win11 node-pty 行为差异 |

### 1.3 代码规范整治

| # | 项 | 说明 |
|---|-----|------|
| R01 | **全组件 Inline Style → CSS 文件迁移** | 逐组件抽离 inline style 到同目录 `index.css`，预估涉及 10+ 文件 |
| R02 | **PencilMainView → TerminalGridView 重命名** | CLAUDE.md 已注明需重命名，当前文件名来自旧项目 |
| R03 | **单文件行数检查** | [Sidebar.tsx](src/extensions/sidebar/Sidebar.tsx) (283行) 接近 300 上限，需预拆分 |
| R04 | **Props 接口规范化** | 检查所有组件 Props 是否有显式 interface，消除 `any` |

### 1.4 体验优化（小版本迭代）

| # | 功能 | 说明 |
|---|------|------|
| E01 | **终端 Tab 切换** | 终端网格增加 Tab 栏，在「全屏单终端 / 网格多终端」之间一键切换 |
| E02 | **终端关闭确认** | 关闭终端前弹确认（进程仍在运行时），防止误操作 |
| E03 | **快捷键系统** | 全局快捷键：`Ctrl+N` 新建终端、`Ctrl+W` 关闭终端、`Ctrl+Tab` 切换终端 |
| E04 | **启动性能优化** | Vite 构建体积优化、主进程启动耗时降低 |
| E05 | **字体大小热调整** | `Ctrl+滚轮` 调整终端字体大小，设置页增加字体选择 |
| E06 | **窗口置顶** | 标题栏增加 📌 置顶按钮，方便对照 CLI 输出操作 |
| E07 | **首次运行向导** | 初次启动引导：检测 Claude Code → 配置 API Key → 启动第一个终端 |
| E08 | **错误边界** | SolidJS ErrorBoundary 包裹各视图，进程崩溃显示友好提示而非白屏 |

---

## 二、中期计划（v0.2 — 功能体系建设）

> **目标**：补齐可视化配置、API Key 管理、多适配器三大核心功能模块。  
> **策略**：每个里程碑独立可测，互不阻塞。

### 2.1 v0.2 可视化配置中心

对应 README roadmap v0.2，将当前的 [AgentConfigPage.tsx](src/views/settings/AgentConfigPage.tsx) 从简单表单升级为完整的配置管理中心。

| # | 功能 | 说明 |
|---|------|------|
| C01 | **动态表单引擎** | 基于 `ConfigAdapter.getConfigSchema()` 返回的 `ConfigSection[]` 自动渲染表单，替代当前 AgentConfigPage 的手写 input |
| C02 | **配置模板市场** | 内置 Cursor CLI、Codex、Gemini CLI、Qwen CLI 的配置模板，一键导入为 GenericAdapter |
| C03 | **实时配置校验** | 表单字段失焦即校验，错误信息精确到字段级（利用 `validate()` 返回值） |
| C04 | **配置 Diff 预览** | 保存前展示变更摘要（增/删/改），防止误改 |
| C05 | **JSON 原文编辑** | 高级模式：直接编辑原生 JSON 文件，带语法高亮和格式校验 |
| C06 | **配置导出/导入** | 导出单个 Agent 配置为 JSON 文件，支持跨机器迁移 |
| C07 | **配置重置** | 一键恢复适配器默认配置 |

### 2.2 v0.3 API Key & 模型管理

对应 README roadmap v0.3。

| # | 功能 | 说明 |
|---|------|------|
| K01 | **系统 KeyChain 集成** | 使用 Electron `safeStorage` 加密 API Key，存入系统凭证管理器（Windows Credential Manager） |
| K02 | **Provider 管理** | 统一管理 Anthropic / OpenAI / Google / Azure / 自定义 endpoint |
| K03 | **模型列表自动发现** | 通过各 Provider API 拉取可用模型列表，缓存到本地 |
| K04 | **一键注入环境变量** | 选择模型/Provider → 自动设置 `ANTHROPIC_API_KEY`、`OPENAI_API_KEY` 等环境变量到 PTY 启动参数 |
| K05 | **Token 用量仪表盘** | 完善 [RuntimeTracker](main/runtime/tracker.ts)，聚合 token 消耗 → 按工具/日期/模型出柱状图 |
| K06 | **用量告警** | 设置 Token 上限 → 接近阈值时桌面通知 |
| K07 | **成本估算** | 根据模型定价表计算大致费用（$），展示在 Dashboard |

### 2.3 多适配器扩展

| # | 功能 | 说明 |
|---|------|------|
| A01 | **Cursor CLI 适配器** | `main/adapters/cursor.ts` — 适配 Cursor 的 CLI 配置 |
| A02 | **Gemini CLI 适配器** | `main/adapters/gemini.ts` — 适配 Google Gemini CLI |
| A03 | **Codex (OpenAI) 适配器** | `main/adapters/codex.ts` — 适配 OpenAI Codex CLI |
| A04 | **适配器自动发现增强** | 扫描 PATH 中已知的 CLI 工具名，自动提示「检测到 XXX，是否添加？」 |
| A05 | **适配器版本管理** | 检测 CLI 工具版本（`--version`），与最低要求版本比对 |

### 2.4 进程管理增强

| # | 功能 | 说明 |
|---|------|------|
| P01 | **会话持久化** | 关闭应用时保存运行中的终端列表，下次启动选择性恢复 |
| P02 | **崩溃自动重启** | PTY 进程异常退出后，3 秒内自动重连（保留终端窗口和输出历史） |
| P03 | **资源监控** | 终端标题栏显示 CPU/内存占用（通过 pid 查询） |
| P04 | **终止确认** | `Ctrl+C` 两次快速按 = 强制 kill，单次 = 发送 SIGINT |
| P05 | **多实例检测** | 检测到已有实例运行 → 激活已有窗口而非启动新实例 |

---

## 三、长期计划（v0.4 — v1.0 生态与分发）

> **目标**：成为 CLI Agent 领域的通用 IDE 级启动器。  
> **策略**：技能管理 → MCP 集成 → 社区生态 → 跨平台。

### 3.1 v0.4 Skills 技能管理

对应 README roadmap v0.4。

| # | 功能 | 说明 |
|---|------|------|
| S01 | **技能浏览器** | 树形展示项目级（`.claude/skills/`）和全局级（`~/.claude/skills/`）技能 |
| S02 | **技能元数据解析** | 解析技能包中的 frontmatter（name / description / version），卡片式展示 |
| S03 | **一键安装** | 拖入 `.zip` 技能包 → 自动解压到正确目录 |
| S04 | **启用/禁用** | 单个技能开关，通过重命名/移出目录实现 |
| S05 | **技能编辑器** | 内嵌 Monaco Editor，在线编辑技能的 markdown 内容 |
| S06 | **技能市场** | 连接社区索引仓库，浏览/搜索/一键下载技能 |

### 3.2 v0.5 MCP 协议集成

对应 README roadmap v0.5。

| # | 功能 | 说明 |
|---|------|------|
| M01 | **MCP Server 管理** | 表单式添加/编辑 MCP Server（command + args + env + autoStart） |
| M02 | **连接状态面板** | 每个 MCP Server 显示运行状态（🟢在线 / 🔴离线 / 🟡连接中）、重连次数、最近错误 |
| M03 | **工具/资源浏览器** | 实时列出每个 MCP Server 暴露的 tools、resources、prompts 及其 JSON Schema |
| M04 | **工具调用测试** | 在 UI 中填写参数 → 调用 MCP tool → 查看返回结果（类似 Postman） |
| M05 | **MCP Server 日志** | 聚合 MCP Server 的 stdout/stderr，按 server 维度过滤 |
| M06 | **MCP Inspector 集成** | 一键启动 MCP Inspector 调试工具 |

### 3.3 窗口与布局

| # | 功能 | 说明 |
|---|------|------|
| W01 | **自定义布局保存** | 用户拖拽调整终端窗口大小/位置 → 保存为命名布局（「编码模式」「调试模式」等） |
| W02 | **多显示器支持** | 拖拽终端窗口到第二个显示器，独立全屏 |
| W03 | **画中画模式** | 终端缩略为小窗悬浮在其他应用之上 |
| W04 | **透明/毛玻璃强度调节** | 滑块控制 backdrop-filter blur 和玻璃透明度 |

### 3.4 插件与扩展

| # | 功能 | 说明 |
|---|------|------|
| X01 | **Extension SDK** | 开放第三方扩展 API，文档化 `ExtensionRegistry` 接口 |
| X02 | **扩展市场** | 社区提交、审核、安装扩展的完整流程 |
| X03 | **内置扩展** | Live2D 看板娘（已有模型资产）、系统监控面板、快捷笔记 |

### 3.5 跨平台与分发

| # | 功能 | 说明 |
|---|------|------|
| D01 | **macOS 支持** | 适配 macOS 窗口管理、`claude` 命令路径、签名公证 |
| D02 | **Linux 支持** | AppImage / deb / rpm 打包，Wayland 兼容 |
| D03 | **自动更新** | electron-updater → 检测新版本 → 下载 → 安装 |
| D04 | **便携版** | 免安装 ZIP 包，适合 U 盘携带 |
| D05 | **企业部署** | MSI 安装包 + GPO 管理模板 + 静默安装 |

### 3.6 质量工程

| # | 功能 | 说明 |
|---|------|------|
| Q01 | **E2E 测试** | Playwright + Electron，覆盖核心用户流程 |
| Q02 | **CI/CD 流水线** | GitHub Actions：lint → test → build → release |
| Q03 | **崩溃报告** | 集成 Sentry / Crashpad，自动上报堆栈和用户操作序列 |
| Q04 | **性能基测** | 启动时间、终端输入延迟、内存占用持续监控 |
| Q05 | **无障碍 (a11y)** | 屏幕阅读器支持、键盘完整操作、高对比度主题 |
| Q06 | **i18n 国际化** | 中文/English/日本語 多语言界面 |

---

## 里程碑总览

```
近期（v0.1.x）  ████████████  🔲 Bug 修复 + 测试 + 规范整治 + 体验优化
中期（v0.2）    ░░░░░░░░░░░░  🔲 可视化配置中心
中期（v0.3）    ░░░░░░░░░░░░  🔲 API Key + 模型管理 + 多适配器
长期（v0.4）    ░░░░░░░░░░░░  🔲 Skills 技能管理
长期（v0.5）    ░░░░░░░░░░░░  🔲 MCP 协议集成
长期（v1.0）    ░░░░░░░░░░░░  🔲 跨平台 + 插件生态 + 自动更新
```

---

## 每周发布模板

每个小版本在 CHANGELOG 中遵循此格式：

```markdown
## v0.1.1 (2026-06-16)

### 🐛 Bug 修复
- 修复 xxx

### ✨ 新增
- 新增 xxx

### 🔧 优化
- 优化 xxx

### 🧪 测试
- 补充 xxx 测试
```

---

*本计划书随开发进展持续更新。*
