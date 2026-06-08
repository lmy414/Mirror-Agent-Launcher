import { BrowserWindow, type WebContents, app } from 'electron'
import fs from 'fs'
import path from 'path'

type LogLevel = 'INFO' | 'WARN' | 'ERROR'

interface LogEntry {
  time: string
  layer: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
}

class Logger {
  private buffer: LogEntry[] = []
  private logFile: string

  constructor() {
    // 在 app ready 之前延迟初始化路径
    this.logFile = ''
  }

  private ensurePath(): string {
    if (!this.logFile) {
      const dir = path.join(app.getPath('userData'), 'logs')
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      this.logFile = path.join(dir, 'app.log')
    }
    return this.logFile
  }

  private format(layer: string, level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    const now = new Date()
    const time = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`
    return { time, layer, level, message, context }
  }

  info(layer: string, message: string, context?: Record<string, unknown>): void {
    this.emit(this.format(layer, 'INFO', message, context))
  }

  warn(layer: string, message: string, context?: Record<string, unknown>): void {
    this.emit(this.format(layer, 'WARN', message, context))
  }

  error(layer: string, message: string, context?: Record<string, unknown>): void {
    this.emit(this.format(layer, 'ERROR', message, context))
  }

  private emit(entry: LogEntry): void {
    this.buffer.push(entry)
    if (this.buffer.length > 1000) this.buffer.shift()

    const prefix = `[${entry.time}] [${entry.layer}] [${entry.level}]`
    const ctx = entry.context ? ` -- ${JSON.stringify(entry.context)}` : ''
    console.log(`${prefix} ${entry.message}${ctx}`)

    // 广播到渲染进程
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('log:stream', entry)
    }

    // 写入文件
    try {
      const filePath = this.ensurePath()
      fs.appendFileSync(filePath, `${prefix} ${entry.message}${ctx}\n`, 'utf-8')
    } catch {
      // 写入失败静默忽略
    }
  }

  getRecent(count = 100): LogEntry[] {
    return this.buffer.slice(-count)
  }

  sendRecent(webContents: WebContents, count = 200): void {
    const recent = this.buffer.slice(-count)
    for (const entry of recent) {
      webContents.send('log:stream', entry)
    }
  }
}

export const logger = new Logger()
