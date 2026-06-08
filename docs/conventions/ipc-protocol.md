# IPC 协议规范

---

## 消息格式

所有 IPC 消息（`ipcMain.handle` / `ipcRenderer.invoke` / `webContents.send`）统一包装：

```typescript
interface IpcRequest<T = unknown> {
  v: number          // 协议版本（当前: 1）
  type: string       // 通道名
  payload: T         // 载荷
  ts: number         // Unix 毫秒时间戳
}

interface IpcResponse<T = unknown> {
  v: number
  ok: boolean        // 是否成功
  data?: T           // 成功时携带的数据
  error?: {          // 失败时的错误信息
    code: string     //   错误码
    message: string  //   人类可读错误信息
    detail?: unknown //   可选详细信息
  }
}
```

---

## 通道一览

### config — 配置操作

| 通道 | 方向 | 请求 | 响应 |
|------|------|------|------|
| `config:list` | Render → Main | `{}` | `{ adapters: [{ toolId, displayName, installed }] }` |
| `config:read` | Render → Main | `{ toolId }` | `{ config, valid, errors? }` |
| `config:write` | Render → Main | `{ toolId, partialConfig }` | `{ ok, errors? }` |
| `config:schema` | Render → Main | `{ toolId }` | `{ sections: ConfigSection[] }` |

### agent — 进程管理

| 通道 | 方向 | 请求 | 响应 |
|------|------|------|------|
| `agent:spawn` | Render → Main | `{ toolId }` | `{ sessionId }` |
| `agent:stop` | Render → Main | `{ sessionId }` | `{ ok }` |
| `agent:restart` | Render → Main | `{ sessionId }` | `{ sessionId }` |
| `agent:list` | Render → Main | `{}` | `{ running: RunningAgent[] }` |

### terminal — 终端 I/O

| 通道 | 方向 | 说明 |
|------|------|------|
| `terminal:stdin` | Render → Main | 渲染进程发送用户输入 |
| `terminal:stdout` | Main → Render | 主进程推送 PTY 输出 |
| `terminal:resize` | Render → Main | xterm 尺寸变化 |
| `terminal:exit` | Main → Render | 进程退出通知 |

`terminal:stdin` / `terminal:stdout` / `terminal:resize` 负载包含 `sessionId` 字段用于路由。

### log — 日志

| 通道 | 方向 | 说明 |
|------|------|------|
| `log:push` | Render → Main | 渲染进程推送日志到主进程聚合 |
| `log:stream` | Main → Render | 主进程广播聚合后的日志条目 |

### window — 窗口

| 通道 | 方向 | 说明 |
|------|------|------|
| `window:minimize` | Render → Main | 最小化窗口 |
| `window:maximize` | Render → Main | 最大化/还原窗口 |
| `window:close` | Render → Main | 关闭窗口 |

---

## 版本化与扩展规则

### 规则

| 变更类型 | 处理方式 |
|----------|----------|
| 新增可选字段（负载中加字段） | 递增 `v` 小版本（如 1.0 → 1.1），旧 consumer 忽略未知字段 |
| 新增必填字段 | 递增 `v` 主版本（如 1 → 2），旧 consumer 需适配 |
| 删除/重命名字段 | 递增 `v` 主版本 |
| 新增通道 | 注册新 handler + 新通道名。已有通道不受影响 |
| 废弃通道 | 保留至少一个大版本周期，标记 `@deprecated`，日志记录调用 |

### 版本协商

连接建立时，渲染进程声明支持的协议版本：

```typescript
// preload.ts 初始化时
const supportedVersions = [1, 2]
const negotiated = await ipcRenderer.invoke('protocol:hello', { v: Math.max(...supportedVersions) })
// 主进程返回双方兼容的最高版本
```

---

## 安全约束

| 规则 | 说明 |
|------|------|
| 白名单 | preload.ts 只暴露 `window.electronAPI.*` 中的方法，不暴露 `ipcRenderer` 本身 |
| 配置路径校验 | `config:write` 的目标文件必须在适配器预定义的路径范围内，禁止任意文件写入 |
| 命令注入防护 | `agent:spawn` 通过适配器的 `getCommand()` 生成命令，不接受前端传入的任意 command 字符串 |
| 日志脱敏 | `config:write` 的日志不记录 `apiKey` 等敏感字段的值 |

---

## 错误码

| code | 含义 |
|------|------|
| `CONFIG_FILE_NOT_FOUND` | 配置文件不存在（首次使用） |
| `CONFIG_PARSE_ERROR` | 配置文件 JSON 解析失败 |
| `CONFIG_VALIDATION_ERROR` | 配置校验不通过 |
| `CONFIG_WRITE_ERROR` | 配置写入失败（权限不足/磁盘满） |
| `ADAPTER_NOT_FOUND` | 未找到对应的适配器 |
| `AGENT_SPAWN_ERROR` | 进程启动失败（命令不存在/权限不足） |
| `AGENT_ALREADY_RUNNING` | 该 agent 已有终端在运行 |
| `AGENT_NOT_RUNNING` | 指定的 session 不存在或已退出 |
| `PROTOCOL_VERSION_MISMATCH` | IPC 协议版本不兼容 |
