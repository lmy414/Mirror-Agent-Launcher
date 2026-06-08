# 日志规范

---

## 格式

```
[YYYY-MM-DD HH:mm:ss.SSS] [layer] [level] message -- context
```

示例：
```
[2026-06-08 14:30:12.456] [main] [INFO] ClaudeCodeAdapter.write: 配置已写入 -- toolId=claude-code file=~/.claude/settings.json fieldsChanged=1
[2026-06-08 14:30:15.001] [pty:claude-code-1] [INFO] 进程已启动 -- pid=12345 cmd=claude cwd=D:\project
[2026-06-08 14:31:00.123] [renderer] [WARN] Sidebar: agent:spawn 超时 -- toolId=codewhale timeoutMs=10000
[2026-06-08 14:32:05.789] [pty:codewhale-1] [ERROR] 进程异常退出 -- exitCode=1 signal=null
[2026-06-08 14:32:05.800] [main] [ERROR] PtyManager: session codewhale-1 崩溃 -- affected=1/3
```

---

## Layer 层级

| Layer | 含义 | 产生者 |
|-------|------|--------|
| `main` | Electron 主进程 | `main/logger.ts` |
| `renderer` | 渲染进程 | `src/bridge/ipc-client.ts`（转发到主进程聚合） |
| `pty:<sessionId>` | PTY 会话级事件 | `main/pty/manager.ts` |

---

## Level 等级

| Level | 含义 | 示例 |
|-------|------|------|
| `INFO` | 正常操作成功 | 配置读写成功、进程启动成功、IPC 调用完成 |
| `WARN` | 可恢复异常 | 重试成功、降级处理、配置校验不通过但允许保存 |
| `ERROR` | 不可恢复错误 | 进程崩溃、文件损坏、权限拒绝 |

---

## 日志必须包含的内容

| 字段 | 必须 | 说明 |
|------|------|------|
| `message` | ✅ | **变更意图**（做了什么，为什么） |
| affected | ✅ | **受影响内容**（改了什么文件/进程/配置字段） |

```typescript
// Good — 说明了意图和受影响内容
logger.info("ClaudeCodeAdapter.write: 更新模型配置", {
  file: "~/.claude/settings.json",
  fieldsChanged: ["model"],
  oldValue: "claude-opus-4-8",
  newValue: "claude-sonnet-4-6"
})

// Bad — 只有动作，没有意图和影响
logger.info("Config written")
```

---

## 日志路由

```
Renderer                                Main Process
    │                                        │
    │  IPC: log:push ──────────────────────→ │  Logger
    │  { layer:"renderer", ... }             │   │
    │                                        │   ├→ console
    │                                        │   ├→ logs/app.log (轮转, 10MB/文件, 最多5个)
    │                                        │   └→ IPC: log:stream → 日志视图 (LogsView)
    │                                        │
    │  pty.onData ────────────────────────→  │
    │  (PTY 退出/错误事件)                    │
```

- 渲染进程不直接写文件，通过 IPC 推送到主进程聚合
- 主进程日志写入 `logs/` 目录（已在 `.gitignore` 排除）
- 日志按天轮转（10MB 或 24h）

---

## 调试模式

设置环境变量 `MIO_LOG_LEVEL=debug` 时，额外记录：

- 所有 IPC 调用的请求/响应（不含密码/token 字段）
- PTY stdin 长度（不记录内容，保护隐私）
- 窗口尺寸变更

```bash
MIO_LOG_LEVEL=debug npm run dev
```
