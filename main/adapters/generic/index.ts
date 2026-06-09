import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import type { ConfigAdapter, ConfigSection } from '../types'
import { validateToolId, validateCommand, validateArgsString, validateCwd } from '../../utils/validation'

/**
 * 通用适配器 — 覆盖无法自动检测的 CLI 工具。
 * 配置存储在 Electron userData 目录下的 JSON 文件中。
 */
export class GenericAdapter implements ConfigAdapter {
  toolId: string
  displayName: string

  constructor(toolId: string, displayName: string) {
    if (!validateToolId(toolId)) {
      throw new Error(`Invalid toolId: ${toolId}`)
    }
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
    // 写入前校验危险字段
    if ('command' in partialConfig) {
      const check = validateCommand(partialConfig.command as string)
      if (!check.valid) throw new Error(check.error)
    }
    if ('args' in partialConfig) {
      const check = validateArgsString(partialConfig.args as string)
      if (!check.valid) throw new Error(check.error)
    }
    if ('cwd' in partialConfig) {
      const check = validateCwd(partialConfig.cwd as string)
      if (!check.valid) throw new Error(check.error)
    }

    const current = this.read()
    Object.assign(current, partialConfig)
    fs.writeFileSync(this.storePath(), JSON.stringify(current, null, 2), 'utf-8')
  }

  validate(config: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    if (!config.command) errors.push('启动命令不能为空')

    const cmdCheck = validateCommand((config.command as string) || '')
    if (!cmdCheck.valid) errors.push(cmdCheck.error || '启动命令不合法')

    const argsCheck = validateArgsString((config.args as string) || '')
    if (!argsCheck.valid) errors.push(argsCheck.error || '命令参数不合法')

    if (config.cwd) {
      const cwdCheck = validateCwd(config.cwd as string)
      if (!cwdCheck.valid) errors.push(cwdCheck.error || '工作目录不合法')
    }

    return { valid: errors.length === 0, errors }
  }

  getCommand(config: Record<string, unknown>): { command: string; args: string[]; cwd: string; env: Record<string, string> } {
    const command = (config.command as string) || this.toolId
    const argsStr = (config.args as string) || ''

    const cmdCheck = validateCommand(command)
    if (!cmdCheck.valid) throw new Error(cmdCheck.error)

    const argsCheck = validateArgsString(argsStr)
    if (!argsCheck.valid) throw new Error(argsCheck.error)

    const args = argsStr ? argsStr.split(/\s+/) : []
    const cwd = (config.cwd as string) || process.cwd()

    const cwdCheck = validateCwd(cwd)
    if (!cwdCheck.valid) throw new Error(cwdCheck.error)

    // 构建最小安全环境变量，不再全量透传 process.env
    const safeKeys = [
      'PATH', 'HOME', 'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH',
      'APPDATA', 'LOCALAPPDATA', 'TEMP', 'TMP',
      'SYSTEMROOT', 'SystemRoot', 'SYSTEMDRIVE',
      'ProgramFiles', 'ProgramFiles(x86)', 'CommonProgramFiles',
      'USERNAME', 'COMPUTERNAME', 'USERDOMAIN',
      'LANG', 'LC_ALL', 'LC_CTYPE',
      'SHELL', 'COLORTERM', 'TERM_PROGRAM',
    ]
    const env: Record<string, string> = { TERM: 'xterm-256color' }
    for (const key of safeKeys) {
      if (process.env[key]) {
        env[key] = process.env[key]!
      }
    }
    // 透传用户显式配置的环境变量
    for (const [k, v] of Object.entries(config)) {
      if (k.startsWith('env.') && typeof v === 'string') {
        env[k.slice(4)] = v
      }
    }

    return { command, args, cwd, env }
  }
}
