import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { registerConfigIpc } from './ipc/config'
import { registerTerminalIpc } from './ipc/terminal'
import { registerAgentIpc } from './ipc/agent'
import { registerSettingsIpc } from './ipc/settings'
import { logger } from './logger'
import { adapterRegistry } from './adapters/registry'
import { ClaudeCodeAdapter } from './adapters/claude-code'
import { KimiCodeAdapter } from './adapters/kimi-code'
import { GenericAdapter } from './adapters/generic'
import { loadWindowState, saveWindowState, type WindowState } from './store/app-state'

let mainWindow: BrowserWindow | null = null

function isDev(): boolean {
  return !app.isPackaged || !!process.env.VITE_DEV_SERVER_URL
}

function createWindow() {
  const saved = loadWindowState()

  mainWindow = new BrowserWindow({
    x: saved.x,
    y: saved.y,
    width: saved.width,
    height: saved.height,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // dist-electron/preload.js
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (saved.isMaximized) mainWindow.maximize()

  const wc = mainWindow.webContents
  logger.subscribe(wc)

  if (isDev() && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 保存窗口状态
  // 防抖保存窗口状态，避免 resize 高频触发同步 I/O
  let saveTimeout: NodeJS.Timeout | null = null
  const debouncedSave = (state: WindowState) => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => saveWindowState(state), 300)
  }

  mainWindow.on('resize', () => {
    if (mainWindow && !mainWindow.isMaximized()) {
      const [w, h] = mainWindow.getSize()
      const [x, y] = mainWindow.getPosition()
      debouncedSave({ x, y, width: w, height: h, isMaximized: false })
    }
  })
  mainWindow.on('maximize', () => saveWindowState({ ...saved, isMaximized: true }))
  mainWindow.on('unmaximize', () => saveWindowState({ ...saved, isMaximized: false }))
  mainWindow.on('closed', () => {
    logger.unsubscribe(wc)
    mainWindow = null
  })
}

// ── 窗口 IPC ──
function registerClipboardIpc() {
  ipcMain.handle('clipboard:readText', () => {
    const { clipboard } = require('electron')
    return clipboard.readText()
  })
}

function registerDialogIpc() {
  ipcMain.handle('dialog:openDirectory', async () => {
    const { dialog } = await import('electron')
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })
}

function registerWindowIpc() {
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on('window:close', () => mainWindow?.close())

  // 日志：渲染进程推送到主进程聚合
  ipcMain.on('log:push', (_e, entry: { level: string; message: string; context?: Record<string, unknown> }) => {
    const level = entry.level as 'INFO' | 'WARN' | 'ERROR'
    logger[level.toLowerCase() as 'info' | 'warn' | 'error']('renderer', entry.message, entry.context)
  })

  // 日志：渲染进程请求历史日志
  ipcMain.on('log:getRecent', (event) => {
    logger.sendRecent(event.sender)
  })
}

app.whenReady().then(() => {
  // 注册内置适配器
  adapterRegistry.register(new ClaudeCodeAdapter())
  adapterRegistry.register(new KimiCodeAdapter())
  // 通用适配器由前端通过 agent:add 动态创建

  registerWindowIpc()
  registerClipboardIpc()
  registerDialogIpc()
  registerConfigIpc()
  registerTerminalIpc()
  registerAgentIpc()
  registerSettingsIpc()
  createWindow()
  logger.info('main', '应用启动完成', { adapters: adapterRegistry.getAll().length })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
