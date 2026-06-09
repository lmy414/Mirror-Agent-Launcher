import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  // ── 窗口操作 ──
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },

  // ── 配置操作 ──
  config: {
    list: () => ipcRenderer.invoke('config:list'),
    read: (toolId: string) => ipcRenderer.invoke('config:read', { toolId }),
    write: (toolId: string, partialConfig: Record<string, unknown>) =>
      ipcRenderer.invoke('config:write', { toolId, partialConfig }),
    schema: (toolId: string) => ipcRenderer.invoke('config:schema', { toolId }),
    openFile: (toolId: string) => ipcRenderer.invoke('config:openFile', { toolId }),
    providers: (toolId: string) => ipcRenderer.invoke('config:providers', { toolId }),
  },

  // ── Agent 进程管理 ──
  agent: {
    spawn: (toolId: string, sessionId?: string, displayName?: string, cwd?: string) =>
      ipcRenderer.invoke('agent:spawn', { toolId, sessionId, displayName, cwd }),
    stop: (sessionId: string) => ipcRenderer.invoke('agent:stop', { sessionId }),
    list: () => ipcRenderer.invoke('agent:list'),
    add: (toolId: string, displayName: string) => ipcRenderer.invoke('agent:add', { toolId, displayName }),
    remove: (toolId: string) => ipcRenderer.invoke('agent:remove', { toolId }),
    install: (toolId: string) => ipcRenderer.invoke('agent:install', { toolId }),
    uninstall: (toolId: string) => ipcRenderer.invoke('agent:uninstall', { toolId }),
  },

  // ── 终端 I/O ──
  terminal: {
    stdin: (sessionId: string, data: string) =>
      ipcRenderer.send('terminal:stdin', { sessionId, data }),
    resize: (sessionId: string, cols: number, rows: number) =>
      ipcRenderer.send('terminal:resize', { sessionId, cols, rows }),
    onStdout: (cb: (data: { sessionId: string; data: string }) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, data: unknown) =>
        cb(data as { sessionId: string; data: string })
      ipcRenderer.on('terminal:stdout', handler)
      return () => ipcRenderer.removeListener('terminal:stdout', handler)
    },
    onExit: (cb: (data: { sessionId: string; exitCode: number; signal: string | null }) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, data: unknown) =>
        cb(data as { sessionId: string; exitCode: number; signal: string | null })
      ipcRenderer.on('terminal:exit', handler)
      return () => ipcRenderer.removeListener('terminal:exit', handler)
    },
  },

  // ── 日志 ──
  log: {
    push: (entry: { level: string; message: string; context?: Record<string, unknown> }) =>
      ipcRenderer.send('log:push', entry),
    getRecent: () => ipcRenderer.send('log:getRecent'),
    onStream: (cb: (entry: unknown) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data)
      ipcRenderer.on('log:stream', handler)
      return () => ipcRenderer.removeListener('log:stream', handler)
    },
  },

  // ── 显示设置持久化 ──
  settings: {
    getAll: () => ipcRenderer.invoke('settings:get'),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', { key, value }),
  },

  // ── 剪贴板 ──
  clipboard: {
    readText: () => ipcRenderer.invoke('clipboard:readText'),
  },

  // ── 文件对话框 ──
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  },

  // ── 运行记录 ──
  runtime: {
    onUpdate: (cb: (records: unknown[]) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data as unknown[])
      ipcRenderer.on('runtime:update', handler)
      return () => ipcRenderer.removeListener('runtime:update', handler)
    },
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
