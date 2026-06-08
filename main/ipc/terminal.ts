import { ipcMain } from 'electron'
import { ptyManager } from '../pty/manager'

export function registerTerminalIpc(): void {
  ipcMain.on('terminal:stdin', (_e, { sessionId, data }: { sessionId: string; data: string }) => {
    ptyManager.write(sessionId, data)
  })

  ipcMain.on('terminal:resize', (_e, { sessionId, cols, rows }: { sessionId: string; cols: number; rows: number }) => {
    ptyManager.resize(sessionId, cols, rows)
  })
}
