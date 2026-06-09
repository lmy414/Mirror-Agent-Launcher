import type { ProviderConfig, ConfigSection } from '../../../types'

export const anthropicProvider: ProviderConfig = {
  id: 'anthropic',
  label: 'Anthropic API (原生)',

  models: [
    { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 — 最强推理' },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 — 日常编码' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 — 快速轻量' },
  ],

  defaultEnv: {},

  buildEnv(userConfig: Record<string, unknown>): Record<string, string> {
    const env: Record<string, string> = {}
    // apiKeyHelper 不注入为环境变量，Claude Code 自行处理
    return env
  },

  getFormSchema(): ConfigSection[] {
    return [
      {
        id: 'anthropic-model',
        label: '模型选择',
        fields: [
          {
            key: 'model',
            label: '默认模型',
            type: 'select',
            defaultValue: 'claude-sonnet-4-6',
            required: true,
            options: this.models.map((m) => ({ label: m.label, value: m.id })),
          },
        ],
      },
      {
        id: 'anthropic-auth',
        label: 'API 认证',
        fields: [
          {
            key: 'apiKeyHelper',
            label: 'API Key Helper',
            type: 'string',
            defaultValue: '',
            required: false,
            placeholder: '如 /usr/bin/op read op://...',
            description: '获取 API Key 的外部命令，留空使用环境变量 ANTHROPIC_API_KEY',
          },
        ],
      },
    ]
  },

  validate(config: Record<string, unknown>): string[] {
    const errors: string[] = []
    if (config.apiKeyHelper && typeof config.apiKeyHelper !== 'string') {
      errors.push('apiKeyHelper 必须是字符串')
    }
    return errors
  },
}
