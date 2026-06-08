import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import type { ConfigAdapter, ConfigSection } from './types'

/**
 * 通用适配器 — 覆盖无法自动检测的 CLI 工具。
 * 配置存储在 Electron userData 目录下的 JSON 文件中。
 */
export class GenericAdapter implements ConfigAdapter {
  toolId: string
  displayName: string

  constructor(toolId: string, displayName: string) {
    this.toolId = toolId
    this.displayName = displayName
  }

  private storePath(): string {
    const dir = path.join(app.getPath('userData'), 'adapters')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    return path.join(dir, `${this.toolId}.json`)
  }

  getConfigSchema(): ConfigSection[] {
    return [
      {
        id: 'launch',
        label: '启动配置',
        fields: [
          { key: 'command', label: '启动命令', type: 'string', defaultValue: '', required: true, placeholder: '如 codewhale' },
          { key: 'args', label: '命令参数（空格分隔）', type: 'string', defaultValue: '', required: false, placeholder: '如 --model gpt-4' },
          { key: 'cwd', label: '工作目录', type: 'path', defaultValue: '', required: true, placeholder: '如 D:\\project' },
        ],
      },
      {
        id: 'env',
        label: '环境变量',
        fields: [
          { key: 'env.TERM', label: 'TERM', type: 'string', defaultValue: 'xterm-256color', required: false },
          { key: 'env.COLORTERM', label: 'COLORTERM', type: 'string', defaultValue: 'truecolor', required: false },
        ],
      },
    ]
  }

  detect(): boolean {
    return false
  }

  read(): Record<string, unknown> {
    const filePath = this.storePath()
    if (!fs.existsSync(filePath)) return {}
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  }

  write(partialConfig: Record<string, unknown>): void {
    const current = this.read()
    Object.assign(current, partialConfig)
    fs.writeFileSync(this.storePath(), JSON.stringify(current, null, 2), 'utf-8')
  }

  validate(config: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    if (!config.command) errors.push('启动命令不能为空')
    return { valid: errors.length === 0, errors }
  }

  getCommand(config: Record<string, unknown>): { command: string; args: string[]; cwd: string; env: Record<string, string> } {
    const argsStr = (config.args as string) || ''
    const args = argsStr ? argsStr.split(/\s+/) : []
    return {
      command: (config.command as string) || this.toolId,
      args,
      cwd: (config.cwd as string) || process.cwd(),
      env: { ...process.env as Record<string, string>, TERM: 'xterm-256color' },
    }
  }
}
