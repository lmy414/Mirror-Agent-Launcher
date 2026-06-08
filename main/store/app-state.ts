import { app } from 'electron'
import path from 'path'
import fs from 'fs'

interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
}

interface AppPersistState {
  window: WindowState
  lastOpenedAt: number
}

const defaultState: AppPersistState = {
  window: { width: 1400, height: 900, isMaximized: false },
  lastOpenedAt: 0,
}

function storePath(): string {
  return path.join(app.getPath('userData'), 'app-state.json')
}

export function loadState(): AppPersistState {
  try {
    if (fs.existsSync(storePath())) {
      const raw = fs.readFileSync(storePath(), 'utf-8')
      return { ...defaultState, ...JSON.parse(raw) }
    }
  } catch {
    // ignore corrupt state file
  }
  return { ...defaultState }
}

export function saveState(state: Partial<AppPersistState>): void {
  const current = loadState()
  const merged = { ...current, ...state, lastOpenedAt: Date.now() }
  fs.writeFileSync(storePath(), JSON.stringify(merged, null, 2), 'utf-8')
}

export function saveWindowState(state: WindowState): void {
  saveState({ window: state })
}

export function loadWindowState(): WindowState {
  return loadState().window
}
