/**
 * 精简的全局状态 — 替换原先的 useAgent.tsx + use-ws.ts + use-session-cache.ts
 *
 * 数据源：Electron IPC（src/bridge/ipc-client.ts）
 * 状态：SolidJS signals
 */

import { createSignal } from 'solid-js'

// ── Agent 列表 ──
export interface AgentConfig {
  toolId: string
  displayName: string
  installed: boolean
}

const [agents, setAgents] = createSignal<AgentConfig[]>([])

// ── 运行中的终端 ──
export interface RunningAgent {
  sessionId: string
  toolId: string
  startedAt: number
  pid: number
}

const [runningAgents, setRunningAgents] = createSignal<RunningAgent[]>([])

// ── 主题（保留原有 theme.ts 体系）──
// theme.ts 中的 createSignal 继续工作，此处不重复定义

// ── 连接状态 ──
const [connected, setConnected] = createSignal(false)

// ── Sidebar 日志 ──
export interface LogEntry {
  time: string
  layer: string
  level: 'INFO' | 'WARN' | 'ERROR'
  message: string
  context?: Record<string, unknown>
}

const [sidebarLogs, setSidebarLogs] = createSignal<LogEntry[]>([])

// ── 导出 ──
export function useAppState() {
  return {
    agents,
    setAgents,
    runningAgents,
    setRunningAgents,
    connected,
    setConnected,
    sidebarLogs,
    appendLog: (entry: LogEntry) => setSidebarLogs((prev) => [...prev.slice(-99), entry]),
  }
}
