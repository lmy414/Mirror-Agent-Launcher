import { ipcMain } from 'electron'
import { ptyManager } from '../pty/manager'

export function registerTerminalIpc(): void {
  ipcMain.on('terminal:stdin', (event, { sessionId, data }: { sessionId: string; data: string }) => {
    ptyManager.write(sessionId, data, event.sender)
  })

  ipcMain.on('terminal:resize', (event, { sessionId, cols, rows }: { sessionId: string; cols: number; rows: number }) => {
    ptyManager.resize(sessionId, cols, rows, event.sender)
  })
}
