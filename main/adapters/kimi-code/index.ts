import os from 'os'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { app } from 'electron'
import type { ConfigAdapter, ConfigSection, ProviderConfig } from '../types'
import { kimiNative, openAI, anthropic, deepseek } from './providers'

const SAFE_ENV_KEYS = [
  'PATH', 'HOME', 'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH',
  'APPDATA', 'LOCALAPPDATA', 'TEMP', 'TMP',
  'SYSTEMROOT', 'SystemRoot', 'SYSTEMDRIVE',
  'ProgramFiles', 'ProgramFiles(x86)', 'CommonProgramFiles',
  'USERNAME', 'COMPUTERNAME', 'USERDOMAIN',
  'LANG', 'LC_ALL', 'LC_CTYPE',
  'SHELL', 'COLORTERM', 'TERM_PROGRAM', 'TERM_PROGRAM_VERSION',
]

export class KimiCodeAdapter implements ConfigAdapter {
  toolId = 'kimi-code'
  displayName = 'Kimi Code'
  private providers = [kimiNative, openAI, anthropic, deepseek]

  /** 原生配置文件路径（用于「查看原始配置」） */
  configPath(): string {
    return path.join(os.homedir(), '.kimi', 'config.toml')
  }

  /** Launcher 自有 store（不污染原生 config.toml） */
  private storePath(): string {
    const dir = path.join(app.getPath('userData'), 'adapters')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    return path.join(dir, `${this.toolId}.json`)
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
      const cmd = process.platform === 'win32' ? 'kimi.cmd' : 'kimi'
      execSync(`${cmd} --version`, { stdio: 'pipe', timeout: 5000 })
      return true
    } catch { return false }
  }

  getConfigSchema(): ConfigSection[] {
    return [{
      id: 'launch', label: '启动配置', fields: [
        { key: 'command', label: '启动命令', type: 'string', defaultValue: process.platform === 'win32' ? 'kimi.cmd' : 'kimi', required: true },
        { key: 'cwd', label: '工作目录', type: 'path', defaultValue: '', required: false },
      ],
    }]
  }

  /** 从 Launcher 自有 store 读取（不碰 ~/.kimi/config.toml） */
  read(): Record<string, unknown> {
    const fp = this.storePath()
    if (!fs.existsSync(fp)) return {}
    try { return JSON.parse(fs.readFileSync(fp, 'utf-8')) }
    catch { return {} }
  }

  /** 写入 Launcher 自有 store（不碰 ~/.kimi/config.toml） */
  write(partial: Record<string, unknown>): void {
    const current = this.read()
    Object.assign(current, partial)
    fs.writeFileSync(this.storePath(), JSON.stringify(current, null, 2), 'utf-8')
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
      command: (config.command as string) || (process.platform === 'win32' ? 'kimi.cmd' : 'kimi'),
      args: [],
      cwd: (config.cwd as string) || process.cwd(),
      env,
    }
  }
}
