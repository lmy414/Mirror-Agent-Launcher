import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { logger } from '../logger'

interface SettingsData {
  [key: string]: string
}

let _storePath: string | null = null

function storePath(): string {
  if (!_storePath) {
    _storePath = path.join(app.getPath('userData'), 'settings.json')
  }
  return _storePath
}

function readAll(): SettingsData {
  try {
    const sp = storePath()
    if (fs.existsSync(sp)) {
      return JSON.parse(fs.readFileSync(sp, 'utf-8'))
    }
  } catch (e) {
    logger.warn('store', 'settings.json 读取失败，使用默认值')
  }
  return {}
}

function writeAll(data: SettingsData): void {
  const sp = storePath()
  const dir = path.dirname(sp)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(sp, JSON.stringify(data, null, 2), 'utf-8')
}

export function getSetting(key: string): string | undefined {
  return readAll()[key]
}

export function setSetting(key: string, value: string): void {
  const data = readAll()
  if (value === '' || value === undefined) {
    delete data[key]
  } else {
    data[key] = value
  }
  writeAll(data)
  logger.info('store', 'settings 写入', { key, value: value.slice(0, 50) })
}

export function getAllSettings(): SettingsData {
  return readAll()
}
