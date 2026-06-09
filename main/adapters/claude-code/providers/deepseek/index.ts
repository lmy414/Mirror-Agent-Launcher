import type { ProviderConfig, ConfigSection } from '../../../types'

export const deepseekProvider: ProviderConfig = {
  id: 'deepseek',
  label: 'DeepSeek API',

  models: [
    { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro — 主力编程 (1M ctx)' },
    { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash — 快速轻量 (1M ctx)' },
  ],

  defaultEnv: {
    ANTHROPIC_BASE_URL: 'https://api.deepseek.com/anthropic',
    API_TIMEOUT_MS: '600000',
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
  },

  buildEnv(userConfig: Record<string, unknown>): Record<string, string> {
    const env: Record<string, string> = { ...this.defaultEnv }

    // 认证方式：AUTH_TOKEN (Bearer) 或 API_KEY (X-Api-Key)
    const authMethod = (userConfig.deepseekAuthMethod as string) || 'auth-token'
    const apiKey = (userConfig.deepseekApiKey as string) || ''
    if (apiKey) {
      if (authMethod === 'api-key') {
        env['ANTHROPIC_API_KEY'] = apiKey
      } else {
        env['ANTHROPIC_AUTH_TOKEN'] = apiKey
      }
    }

    // 模型映射
    const opusModel = (userConfig.deepseekOpusModel as string) || 'deepseek-v4-pro'
    const sonnetModel = (userConfig.deepseekSonnetModel as string) || 'deepseek-v4-pro'
    const haikuModel = (userConfig.deepseekHaikuModel as string) || 'deepseek-v4-flash'

    env['ANTHROPIC_DEFAULT_OPUS_MODEL'] = opusModel
    env['ANTHROPIC_DEFAULT_SONNET_MODEL'] = sonnetModel
    env['ANTHROPIC_DEFAULT_HAIKU_MODEL'] = haikuModel

    // 附加配置
    const timeout = (userConfig.deepseekTimeout as string) || '600000'
    env['API_TIMEOUT_MS'] = timeout

    const effort = (userConfig.deepseekEffort as string) || 'max'
    env['CLAUDE_CODE_EFFORT_LEVEL'] = effort

    return env
  },

  getFormSchema(): ConfigSection[] {
    return [
      {
        id: 'deepseek-model',
        label: '模型映射',
        description: 'Claude Code 按能力等级选择模型，将 Claude 模型名映射到 DeepSeek 模型',
        fields: [
          {
            key: 'deepseekOpusModel',
            label: 'Opus 级模型 (最复杂推理)',
            type: 'select',
            defaultValue: 'deepseek-v4-pro',
            required: true,
            options: this.models.map((m) => ({ label: m.label, value: m.id })),
          },
          {
            key: 'deepseekSonnetModel',
            label: 'Sonnet 级模型 (主力编程)',
            type: 'select',
            defaultValue: 'deepseek-v4-pro',
            required: true,
            options: this.models.map((m) => ({ label: m.label, value: m.id })),
          },
          {
            key: 'deepseekHaikuModel',
            label: 'Haiku 级模型 (轻量任务)',
            type: 'select',
            defaultValue: 'deepseek-v4-flash',
            required: true,
            options: this.models.map((m) => ({ label: m.label, value: m.id })),
          },
        ],
      },
      {
        id: 'deepseek-auth',
        label: 'API 连接',
        fields: [
          {
            key: 'deepseekEndpoint',
            label: 'API Endpoint',
            type: 'string',
            defaultValue: 'https://api.deepseek.com/anthropic',
            required: true,
            placeholder: 'https://api.deepseek.com/anthropic',
            description: 'ANTHROPIC_BASE_URL',
          },
          {
            key: 'deepseekAuthMethod',
            label: '认证方式',
            type: 'select',
            defaultValue: 'auth-token',
            required: true,
            options: [
              { label: 'Bearer Token (ANTHROPIC_AUTH_TOKEN)', value: 'auth-token' },
              { label: 'X-Api-Key (ANTHROPIC_API_KEY)', value: 'api-key' },
            ],
          },
          {
            key: 'deepseekApiKey',
            label: 'API Key',
            type: 'string',
            defaultValue: '',
            required: false,
            placeholder: 'sk-...',
            description: 'DeepSeek API Key',
          },
          {
            key: 'deepseekTimeout',
            label: '超时 (ms)',
            type: 'number',
            defaultValue: '600000',
            required: false,
            description: 'API_TIMEOUT_MS',
          },
          {
            key: 'deepseekEffort',
            label: 'Effort Level',
            type: 'select',
            defaultValue: 'max',
            required: false,
            options: [
              { label: 'max', value: 'max' },
              { label: 'high', value: 'high' },
              { label: 'medium', value: 'medium' },
              { label: 'low', value: 'low' },
            ],
          },
        ],
      },
    ]
  },

  validate(config: Record<string, unknown>): string[] {
    const errors: string[] = []
    return errors
  },
}
