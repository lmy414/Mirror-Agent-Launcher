# Git 规范

---

## Commit 格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
<type>(<scope>): <description>

[body]
```

### Type

| Type | 用途 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(pty): 实现 PtyManager.spawn 方法` |
| `fix` | Bug 修复 | `fix(terminal): 修复 resize 时缓冲区溢出` |
| `refactor` | 重构，不改变外部行为 | `refactor(sidebar): 提取 AgentList 为独立组件` |
| `style` | 样式变更（CSS 整理、变量重命名等） | `style(tokens): 统一间距变量命名` |
| `docs` | 文档 | `docs(conventions): 添加日志规范` |
| `chore` | 构建脚本、依赖更新、配置 | `chore: 配置 electron-builder` |

### Scope

| Scope | 范围 |
|-------|------|
| `main` | Electron 主进程框架代码（窗口、入口） |
| `pty` | PTY 进程管理 |
| `adapter` | ConfigAdapter 接口 + 注册中心 |
| `adapter:claude` | ClaudeCodeAdapter |
| `adapter:generic` | GenericAdapter |
| `ipc` | IPC 通信层 |
| `renderer` | 渲染进程框架代码 |
| `terminal` | 终端视图组件 |
| `sidebar` | 侧边栏 |
| `settings` | 设置页 |
| `logs` | 日志视图 |
| `nav` | 导航栏 |
| `theme` | 主题系统 |
| `styles` | 样式库 |
| `state` | 全局状态 |
| `bridge` | IPC 客户端封装 |
| `store` | 主进程持久化存储 |
| `build` | 构建打包 |

---

## Branch 命名

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feat/` | 功能分支 | `feat/claude-code-adapter` |
| `fix/` | 修复分支 | `fix/pty-resize-buffer` |
| `refactor/` | 重构分支 | `refactor/settings-extract-components` |

---

## Merge 策略

- 所有合并使用 **squash merge**，保持主干干净
- Squash 后的 commit message 遵循上述格式

---

## 示例

```bash
git commit -m "feat(adapter:claude): 实现 ClaudeCodeAdapter 配置读写

- read() 解析 ~/.claude/settings.json
- write() 支持部分更新，read-merge-write
- detect() 通过 which claude 检测安装状态
- 配置 group 映射：general / api / hooks"
```

```
feat(pty): 实现 PtyManager，替代 terminal-server

- 使用 node-pty 替换 child_process.spawn
- 支持 TUI 应用的完整 ANSI 渲染
- 增加 session 级别 resize/kill 控制
```

```
refactor(settings): SettingsLayoutView 拆分为多个组件

原文件 1193 行。拆分为：
- SettingsLayoutView.tsx (主框架, 180行)
- pages/AgentConfigPage.tsx (320行)
- pages/DisplayPage.tsx (290行)
- pages/SystemPage.tsx (150行)
- components/AccentColorPicker.tsx (80行)
```
