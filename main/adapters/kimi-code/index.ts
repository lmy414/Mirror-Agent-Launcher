import os from 'os'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import type { ConfigAdapter, ConfigSection, ProviderConfig } from '../types'

const SAFE_ENV_KEYS = [
  'PATH', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'TEMP', 'TMP',
  'SYSTEMROOT', 'SystemRoot', 'USERNAME', 'COMPUTERNAME',
]

// ── 内置 Provider ──

const kimiNativeProvider: ProviderConfig = {
  id: 'kimi',
  label: 'Kimi (月之暗面)',
  models: [
    { id: 'kimi-for-coding', label: 'Kimi for Coding — 主力编程' },
    { id: 'kimi-k2-thinking-turbo', label: 'Kimi K2 Thinking Turbo — 深度推理' },
  ],
  defaultEnv: {},
  buildEnv(userConfig: Record<string, unknown>): Record<string, string> {
    const env: Record<string, string> = {}
    const apiKey = (userConfig.kimiApiKey as string) || ''
    const baseUrl = (userConfig.kimiBaseUrl as string) || ''
    const model = (userConfig.kimiModel as string) || 'kimi-for-coding'
    if (apiKey) env['KIMI_API_KEY'] = apiKey
    if (baseUrl) env['KIMI_BASE_URL'] = baseUrl
    env['KIMI_MODEL_NAME'] = model
    return env
  },
  getFormSchema(): ConfigSection[] {
    return [
      {
        id: 'kimi-model',
        label: '模型选择',
        fields: [{
          key: 'kimiModel', label: '默认模型', type: 'select',
          defaultValue: 'kimi-for-coding', required: true,
          options: this.models.map(m => ({ label: m.label, value: m.id })),
        }],
      },
      {
        id: 'kimi-auth',
        label: 'API 连接',
        fields: [
          { key: 'kimiApiKey', label: 'API Key', type: 'string', defaultValue: '', required: false, placeholder: 'sk-...' },
          { key: 'kimiBaseUrl', label: 'API Base URL（可选）', type: 'string', defaultValue: '', required: false, placeholder: 'https://api.kimi.com/coding/v1' },
        ],
      },
    ]
  },
  validate(_c: Record<string, unknown>): string[] { return [] },
}

// ── 主适配器 ──

export class KimiCodeAdapter implements ConfigAdapter {
  toolId = 'kimi-code'
  displayName = 'Kimi Code'
  private providers = [kimiNativeProvider]

  configPath(): string {
    return path.join(os.homedir(), '.kimi', 'config.toml')
  }

  getProviders(): ProviderConfig[] {
    return this.providers
  }

  getConfigPath(): string {
    return this.configPath()
  }

  getInstallCommand(): { command: string; args: string[] } {
    return {
      command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
      args: ['install', '-g', '@moonshot-ai/kimi-code'],
    }
  }

  getUninstallCommand(): { command: string; args: string[] } {
    return {
      command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
      args: ['uninstall', '-g', '@moonshot-ai/kimi-code'],
    }
  }

  detect(): boolean {
    try {
      execSync('kimi --version', { stdio: 'pipe', timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  getConfigSchema(): ConfigSection[] {
    return [
      {
        id: 'launch',
        label: '启动配置',
        fields: [
          { key: 'command', label: '启动命令', type: 'string', defaultValue: 'kimi', required: true },
          { key: 'cwd', label: '工作目录', type: 'path', defaultValue: '', required: false },
        ],
      },
    ]
  }

  read(): Record<string, unknown> {
    const fp = this.configPath()
    if (!fs.existsSync(fp)) return {}
    try {
      const raw = fs.readFileSync(fp, 'utf-8')
      return this.parseToml(raw)
    } catch { return {} }
  }

  write(partial: Record<string, unknown>): void {
    const fp = this.configPath()
    const dir = path.dirname(fp)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    let current: Record<string, unknown> = {}
    if (fs.existsSync(fp)) {
      try { current = this.parseToml(fs.readFileSync(fp, 'utf-8')) } catch { /* keep empty */ }
    }
    Object.assign(current, partial)
    // 只写回已知字段（model / provider / api key），保留用户手动配置
    fs.writeFileSync(fp, this.formatToml(current), 'utf-8')
  }

  validate(config: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    if (!config.command) errors.push('启动命令不能为空')
    return { valid: errors.length === 0, errors }
  }

  getCommand(config: Record<string, unknown>): {
    command: string; args: string[]; cwd: string; env: Record<string, string>
  } {
    const env: Record<string, string> = { TERM: 'xterm-256color' }
    for (const key of SAFE_ENV_KEYS) {
      if (process.env[key]) env[key] = process.env[key]!
    }
    const provider = (config.provider as string) || 'kimi'
    const p = this.providers.find(x => x.id === provider)
    if (p) {
      Object.assign(env, p.defaultEnv)
      Object.assign(env, p.buildEnv(config))
    }
    return {
      command: (config.command as string) || 'kimi',
      args: [],
      cwd: (config.cwd as string) || process.cwd(),
      env,
    }
  }

  /** 简单 TOML → JSON 转换（仅处理顶层 key = value） */
  private parseToml(content: string): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('[')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      let val = trimmed.slice(eqIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      result[key] = val
    }
    return result
  }

  /** JSON → TOML 序列化（仅顶层） */
  private formatToml(data: Record<string, unknown>): string {
    const lines: string[] = []
    for (const [k, v] of Object.entries(data)) {
      if (v === null || v === undefined || v === '') continue
      if (typeof v === 'string') lines.push(`${k} = "${v}"`)
      else lines.push(`${k} = ${v}`)
    }
    return lines.join('\n') + '\n'
  }
}
