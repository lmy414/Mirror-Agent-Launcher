import os from 'os'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import type { ConfigAdapter, ConfigSection, ProviderConfig } from '../types'
import { anthropicProvider } from './providers/anthropic'
import { deepseekProvider } from './providers/deepseek'

function homeDir(): string {
  return os.homedir()
}

/** 将嵌套 settings.json 展平 / 还原 */
function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flatten(v as Record<string, unknown>, key))
    } else {
      result[key] = v
    }
  }
  return result
}

function unflatten(flat: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(flat)) {
    const parts = k.split('.')
    let current = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {}
      }
      current = current[parts[i]] as Record<string, unknown>
    }
    current[parts[parts.length - 1]] = v
  }
  return result
}

/** 安全环境变量白名单 */
const SAFE_ENV_KEYS = [
  'PATH', 'HOME', 'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH',
  'APPDATA', 'LOCALAPPDATA', 'TEMP', 'TMP',
  'SYSTEMROOT', 'SystemRoot', 'SYSTEMDRIVE',
  'ProgramFiles', 'ProgramFiles(x86)', 'CommonProgramFiles',
  'USERNAME', 'COMPUTERNAME', 'USERDOMAIN',
  'LANG', 'LC_ALL', 'LC_CTYPE',
  'SHELL', 'COLORTERM', 'TERM_PROGRAM', 'TERM_PROGRAM_VERSION',
]

export class ClaudeCodeAdapter implements ConfigAdapter {
  toolId = 'claude-code'
  displayName = 'Claude Code'

  private providers = [anthropicProvider, deepseekProvider]

  configPath(): string {
    return path.join(homeDir(), '.claude', 'settings.json')
  }

  getProviders(): ProviderConfig[] {
    return this.providers
  }

  getConfigSchema(): ConfigSection[] {
    return [
      {
        id: 'general',
        label: '基本设置',
        fields: [
          {
            key: 'theme', label: '主题', type: 'select',
            defaultValue: 'dark',
            required: false,
            options: [
              { label: '暗色', value: 'dark' },
              { label: '亮色', value: 'light' },
            ],
          },
          {
            key: 'autoCompact', label: '自动压缩上下文', type: 'boolean',
            defaultValue: true, required: false,
          },
        ],
      },
    ]
  }

  detect(): boolean {
    try {
      execSync('claude --version', { stdio: 'pipe', timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  read(): Record<string, unknown> {
    const filePath = this.configPath()
    const base = this.defaults()
    if (!fs.existsSync(filePath)) {
      return base
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return { ...base, ...flatten(parsed) }
  }

  write(partialConfig: Record<string, unknown>): void {
    const filePath = this.configPath()
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    let current = this.defaults()
    if (fs.existsSync(filePath)) {
      current = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    }
    const flat = flatten(current)
    Object.assign(flat, partialConfig)
    const merged = unflatten(flat)
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf-8')
  }

  validate(config: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    if (config.model && typeof config.model !== 'string') {
      errors.push('model 必须是字符串')
    }
    if (config.apiKeyHelper && typeof config.apiKeyHelper !== 'string') {
      errors.push('apiKeyHelper 必须是字符串')
    }
    const provider = (config.provider as string) || 'anthropic'
    const p = this.providers.find((x) => x.id === provider)
    if (p) {
      errors.push(...p.validate(config))
    }
    return { valid: errors.length === 0, errors }
  }

  getCommand(config: Record<string, unknown>): {
    command: string
    args: string[]
    cwd: string
    env: Record<string, string>
  } {
    // 安全系统环境变量
    const env: Record<string, string> = { TERM: 'xterm-256color' }
    for (const key of SAFE_ENV_KEYS) {
      if (process.env[key]) {
        env[key] = process.env[key]!
      }
    }

    // 根据 provider 注入厂商环境变量
    const provider = (config.provider as string) || 'anthropic'
    const p = this.providers.find((x) => x.id === provider)
    if (p) {
      // 先合并默认值
      Object.assign(env, p.defaultEnv)
      // 再应用用户配置
      Object.assign(env, p.buildEnv(config))
    }

    // 透传用户显式配置的环境变量
    for (const [k, v] of Object.entries(config)) {
      if (k.startsWith('env.') && typeof v === 'string') {
        env[k.slice(4)] = v
      }
    }

    return {
      command: process.platform === 'win32' ? 'claude.cmd' : 'claude',
      args: [],
      cwd: (config.cwd as string) || process.cwd(),
      env,
    }
  }

  getConfigPath(): string {
    return this.configPath()
  }

  private defaults(): Record<string, unknown> {
    return {
      model: 'claude-sonnet-4-6',
      theme: 'dark',
      autoCompact: true,
    }
  }
}
