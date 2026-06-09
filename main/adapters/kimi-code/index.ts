import { execSync } from 'child_process'
import type { ConfigAdapter, ConfigSection } from '../types'

export class KimiCodeAdapter implements ConfigAdapter {
  toolId = 'kimi-code'
  displayName = 'Kimi Code'

  detect(): boolean {
    try {
      execSync('kimi --version', { stdio: 'pipe', timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  getInstallCommand(): { command: string; args: string[] } {
    return {
      command: 'powershell',
      args: ['-Command', 'irm https://code.kimi.com/kimi-code/install.ps1 | iex'],
    }
  }

  getUninstallCommand(): { command: string; args: string[] } {
    return {
      command: 'npm',
      args: ['uninstall', '-g', '@anthropic-ai/kimi-code'],
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
    return {}
  }

  write(_partial: Record<string, unknown>): void {
    // Kimi Code 无原生配置文件，暂不持久化
  }

  validate(config: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    if (!config.command) errors.push('启动命令不能为空')
    return { valid: errors.length === 0, errors }
  }

  getCommand(config: Record<string, unknown>): {
    command: string; args: string[]; cwd: string; env: Record<string, string>
  } {
    const safeKeys = [
      'PATH', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'TEMP', 'TMP',
      'SYSTEMROOT', 'SystemRoot', 'USERNAME', 'COMPUTERNAME',
    ]
    const env: Record<string, string> = { TERM: 'xterm-256color' }
    for (const key of safeKeys) {
      if (process.env[key]) env[key] = process.env[key]!
    }
    return {
      command: (config.command as string) || 'kimi',
      args: [],
      cwd: (config.cwd as string) || process.cwd(),
      env,
    }
  }
}
