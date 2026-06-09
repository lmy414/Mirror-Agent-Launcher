import os from 'os'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import type { ConfigAdapter, ConfigSection, ProviderConfig } from '../types'
import { kimiNative, openAI, anthropic, deepseek } from './providers'

const SAFE_ENV_KEYS = [
  'PATH', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'TEMP', 'TMP',
  'SYSTEMROOT', 'SystemRoot', 'USERNAME', 'COMPUTERNAME',
]

export class KimiCodeAdapter implements ConfigAdapter {
  toolId = 'kimi-code'
  displayName = 'Kimi Code'
  private providers = [kimiNative, openAI, anthropic, deepseek]

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
    } catch { return false }
  }

  getConfigSchema(): ConfigSection[] {
    return [{
      id: 'launch', label: '启动配置', fields: [
        { key: 'command', label: '启动命令', type: 'string', defaultValue: 'kimi', required: true },
        { key: 'cwd', label: '工作目录', type: 'path', defaultValue: '', required: false },
      ],
    }]
  }

  read(): Record<string, unknown> {
    const fp = this.configPath()
    if (!fs.existsSync(fp)) return {}
    try {
      const raw = fs.readFileSync(fp, 'utf-8')
      const result: Record<string, unknown> = {}
      for (const line of raw.split('\n')) {
        const t = line.trim()
        if (!t || t.startsWith('#') || t.startsWith('[')) continue
        const i = t.indexOf('=')
        if (i === -1) continue
        const k = t.slice(0, i).trim()
        let v = t.slice(i + 1).trim()
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
        result[k] = v
      }
      return result
    } catch { return {} }
  }

  write(partial: Record<string, unknown>): void {
    const fp = this.configPath()
    const dir = path.dirname(fp)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    let current: Record<string, unknown> = {}
    if (fs.existsSync(fp)) {
      try { current = this.read() } catch { /* keep empty */ }
    }
    Object.assign(current, partial)
    const lines: string[] = []
    for (const [k, v] of Object.entries(current)) {
      if (v === null || v === undefined || v === '') continue
      lines.push(typeof v === 'string' ? `${k} = "${v}"` : `${k} = ${v}`)
    }
    fs.writeFileSync(fp, lines.join('\n') + '\n', 'utf-8')
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
}
