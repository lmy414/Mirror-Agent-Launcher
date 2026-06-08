import os from 'os'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import type { ConfigAdapter, ConfigSection } from './types'

function homeDir(): string {
  return os.homedir()
}

/** 将嵌套 settings.json 展平 / 还原 */
// settings.json 结构示例:
// { "model": "...", "theme": "...", "autoCompact": true, "apiKeyHelper": "...", "hooks": {...} }

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

export class ClaudeCodeAdapter implements ConfigAdapter {
  toolId = 'claude-code'
  displayName = 'Claude Code'

  protected configPath(): string {
    return path.join(homeDir(), '.claude', 'settings.json')
  }

  getConfigSchema(): ConfigSection[] {
    return [
      {
        id: 'general',
        label: '基本设置',
        fields: [
          {
            key: 'model', label: '默认模型', type: 'select',
            defaultValue: 'claude-sonnet-4-6',
            required: true,
            options: [
              { label: 'Opus 4.8', value: 'claude-opus-4-8' },
              { label: 'Sonnet 4.6', value: 'claude-sonnet-4-6' },
              { label: 'Haiku 4.5', value: 'claude-haiku-4-5-20251001' },
            ],
          },
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
      {
        id: 'api',
        label: 'API 连接',
        fields: [
          {
            key: 'apiKeyHelper', label: 'API Key Helper', type: 'string',
            defaultValue: '',
            required: false,
            placeholder: '如 /usr/bin/op read op://...',
            description: '用于获取 API Key 的外部命令',
          },
        ],
      },
      {
        id: 'hooks',
        label: 'Hooks',
        fields: [
          {
            key: 'hooks.enabled', label: '启用 Hooks', type: 'boolean',
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
    // 确保目录存在
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    // read-merge-write，从默认值开始
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
    return { valid: errors.length === 0, errors }
  }

  getCommand(config: Record<string, unknown>): { command: string; args: string[]; cwd: string; env: Record<string, string> } {
    return {
      command: process.platform === 'win32' ? 'claude.cmd' : 'claude',
      args: [],
      cwd: (config.cwd as string) || process.cwd(),
      env: { ...process.env as Record<string, string>, TERM: 'xterm-256color' },
    }
  }

  private defaults(): Record<string, unknown> {
    return {
      model: 'claude-sonnet-4-6',
      theme: 'dark',
      autoCompact: true,
      'hooks.enabled': true,
    }
  }
}
