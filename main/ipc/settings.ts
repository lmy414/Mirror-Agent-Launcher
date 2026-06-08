import { ipcMain } from 'electron'
import { getAllSettings, setSetting } from '../store/settings'

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', () => {
    return { ok: true, data: getAllSettings() }
  })

  ipcMain.handle('settings:set', (_e, { key, value }: { key: string; value: string }) => {
    setSetting(key, value)
    return { ok: true }
  })
}
