/**
 * IPC 客户端 — 渲染进程调用主进程的统一入口
 *
 * 封装 window.electronAPI，提供类型安全的异步调用。
 * 当不在 Electron 环境时（浏览器开发），返回 mock 实现。
 */

const mockResponse = <T>(data: T): { ok: true; data: T } => ({ ok: true, data })

const isElectron = typeof window !== 'undefined' && window.electronAPI

// ── 配置 ──
export async function configList(): Promise<{ toolId: string; displayName: string; installed: boolean }[]> {
  if (!isElectron) return []
  return window.electronAPI.config.list()
}

export async function configRead(toolId: string): Promise<{ ok: boolean; data?: { config: Record<string, unknown>; valid: boolean; errors: string[] }; error?: { code: string; message: string } }> {
  if (!isElectron) return mockResponse({ config: {}, valid: false, errors: ['非 Electron 环境'] })
  return window.electronAPI.config.read(toolId)
}

export async function configWrite(toolId: string, partialConfig: Record<string, unknown>): Promise<{ ok: boolean; data?: { valid: boolean; errors: string[] }; error?: { code: string; message: string } }> {
  if (!isElectron) return { ok: false, error: { code: 'NO_ELECTRON', message: '非 Electron 环境' } }
  return window.electronAPI.config.write(toolId, partialConfig)
}

export async function configProviders(toolId: string): Promise<{
  ok: boolean
  data?: { id: string; label: string; models: { id: string; label: string }[]; sections: { id: string; label: string; description?: string; fields: { key: string; label: string; type: string; description?: string; defaultValue: unknown; required: boolean; options?: { label: string; value: string }[]; placeholder?: string }[] }[] }[]
  error?: { code: string; message: string }
}> {
  if (!isElectron) return { ok: false, error: { code: 'NO_ELECTRON', message: '非 Electron 环境' } }
  return window.electronAPI.config.providers(toolId)
}

export async function configSchema(toolId: string): Promise<{ ok: boolean; data?: { sections: unknown[] }; error?: { code: string; message: string } }> {
  if (!isElectron) return mockResponse({ sections: [] })
  return window.electronAPI.config.schema(toolId)
}

// ── Agent ──
export async function agentSpawn(toolId: string, sessionId?: string, displayName?: string, cwd?: string): Promise<{ ok: boolean; data?: { sessionId: string }; error?: { code: string; message: string } }> {
  if (!isElectron) return { ok: false, error: { code: 'NO_ELECTRON', message: '非 Electron 环境' } }
  return window.electronAPI.agent.spawn(toolId, sessionId, displayName, cwd)
}

export async function agentStop(sessionId: string): Promise<{ ok: boolean }> {
  if (!isElectron) return { ok: false }
  return window.electronAPI.agent.stop(sessionId)
}

export async function agentList(): Promise<{ ok: boolean; data?: { running: unknown[] } }> {
  if (!isElectron) return mockResponse({ running: [] })
  return window.electronAPI.agent.list()
}

export async function agentAdd(toolId: string, displayName: string): Promise<{ ok: boolean; error?: { code: string; message: string } }> {
  if (!isElectron) return { ok: false, error: { code: 'NO_ELECTRON', message: '非 Electron 环境' } }
  return window.electronAPI.agent.add(toolId, displayName)
}

export async function agentRemove(toolId: string): Promise<{ ok: boolean; error?: { code: string; message: string } }> {
  if (!isElectron) return { ok: false, error: { code: 'NO_ELECTRON', message: '非 Electron 环境' } }
  return window.electronAPI.agent.remove(toolId)
}

// ── 终端 ──
export function terminalStdin(sessionId: string, data: string): void {
  window.electronAPI?.terminal.stdin(sessionId, data)
}

export function terminalResize(sessionId: string, cols: number, rows: number): void {
  window.electronAPI?.terminal.resize(sessionId, cols, rows)
}

export function onTerminalStdout(cb: (data: { sessionId: string; data: string }) => void): () => void {
  if (!window.electronAPI) return () => {}
  return window.electronAPI.terminal.onStdout(cb)
}

export function onTerminalExit(cb: (data: { sessionId: string; exitCode: number; signal: string | null }) => void): () => void {
  if (!window.electronAPI) return () => {}
  return window.electronAPI.terminal.onExit(cb)
}

// ── 日志 ──
export function logPush(level: 'INFO' | 'WARN' | 'ERROR', message: string, context?: Record<string, unknown>): void {
  window.electronAPI?.log.push({ level, message, context })
}

export function logGetRecent(): void {
  window.electronAPI?.log.getRecent()
}

export function onLogStream(cb: (entry: unknown) => void): () => void {
  if (!window.electronAPI) return () => {}
  return window.electronAPI.log.onStream(cb)
}

// ── 窗口 ──
export function windowMinimize(): void { window.electronAPI?.window.minimize() }
export function windowMaximize(): void { window.electronAPI?.window.maximize() }
export function windowClose(): void { window.electronAPI?.window.close() }

// ── 设置持久化 ──
export async function settingsGetAll(): Promise<Record<string, string>> {
  if (!isElectron) return {}
  const result = await window.electronAPI.settings.getAll()
  return result.ok ? result.data : {}
}

export async function settingsSet(key: string, value: string): Promise<void> {
  window.electronAPI?.settings.set(key, value)
}

// ── 文件对话框 ──
export async function dialogOpenDirectory(): Promise<string | null> {
  if (!isElectron) return null
  return window.electronAPI.dialog.openDirectory()
}

// ── 运行记录 ──
export interface RuntimeRecord {
  sessionId: string
  toolId: string
  displayName: string
  startedAt: number
  endedAt?: number
  exitCode?: number
  tokensIn: number
  tokensOut: number
}

export function onRuntimeUpdate(cb: (records: RuntimeRecord[]) => void): () => void {
  if (!window.electronAPI) return () => {}
  return window.electronAPI.runtime.onUpdate(cb as (records: unknown[]) => void)
}
