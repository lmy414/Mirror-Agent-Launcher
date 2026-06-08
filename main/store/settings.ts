import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { logger } from '../logger'

interface SettingsData {
  [key: string]: string
}

const STORE_PATH = path.join(app.getPath('userData'), 'settings.json')

function readAll(): SettingsData {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))
    }
  } catch (e) {
    logger.warn('store', 'settings.json 读取失败，使用默认值')
  }
  return {}
}

function writeAll(data: SettingsData): void {
  const dir = path.dirname(STORE_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8')
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
