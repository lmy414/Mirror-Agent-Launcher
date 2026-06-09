import type { ProviderConfig } from '../../types'

// ── Kimi 原生 ──
export const kimiNative: ProviderConfig = {
  id: 'kimi',
  label: 'Kimi (月之暗面)',
  models: [
    { id: 'kimi-for-coding', label: 'Kimi for Coding — 主力编程' },
    { id: 'kimi-k2-thinking-turbo', label: 'Kimi K2 Thinking Turbo — 深度推理' },
    { id: 'kimi-k2.5', label: 'Kimi K2.5' },
  ],
  defaultEnv: {},
  buildEnv(c: Record<string, unknown>): Record<string, string> {
    const env: Record<string, string> = {}
    if (c.kimiApiKey) env['KIMI_API_KEY'] = c.kimiApiKey as string
    if (c.kimiBaseUrl) env['KIMI_BASE_URL'] = c.kimiBaseUrl as string
    env['KIMI_MODEL_NAME'] = (c.kimiModel as string) || 'kimi-for-coding'
    return env
  },
  getFormSchema() {
    return [{
      id: 'kimi-model', label: '模型选择', fields: [{
        key: 'kimiModel', label: '默认模型', type: 'select', defaultValue: 'kimi-for-coding',
        required: true, options: this.models.map(m => ({ label: m.label, value: m.id })),
      }],
    }, {
      id: 'kimi-auth', label: 'API 连接', fields: [
        { key: 'kimiApiKey', label: 'API Key', type: 'string', defaultValue: '', required: false, placeholder: 'sk-...' },
        { key: 'kimiBaseUrl', label: 'Base URL', type: 'string', defaultValue: 'https://api.kimi.com/coding/v1', required: false, placeholder: 'https://api.kimi.com/coding/v1' },
      ],
    }]
  },
  validate() { return [] },
}

// ── OpenAI ──
export const openAI: ProviderConfig = {
  id: 'openai',
  label: 'OpenAI',
  models: [
    { id: 'gpt-4.1', label: 'GPT-4.1' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { id: 'o4-mini', label: 'o4-mini' },
  ],
  defaultEnv: {},
  buildEnv(c: Record<string, unknown>): Record<string, string> {
    const env: Record<string, string> = {}
    if (c.openaiApiKey) env['OPENAI_API_KEY'] = c.openaiApiKey as string
    if (c.openaiBaseUrl) env['OPENAI_BASE_URL'] = c.openaiBaseUrl as string
    return env
  },
  getFormSchema() {
    return [{
      id: 'openai-model', label: '模型选择', fields: [{
        key: 'openaiModel', label: '默认模型', type: 'select', defaultValue: 'gpt-4.1',
        required: true, options: this.models.map(m => ({ label: m.label, value: m.id })),
      }],
    }, {
      id: 'openai-auth', label: 'API 连接', fields: [
        { key: 'openaiApiKey', label: 'API Key', type: 'string', defaultValue: '', required: false, placeholder: 'sk-...' },
        { key: 'openaiBaseUrl', label: 'Base URL（可选）', type: 'string', defaultValue: '', required: false, placeholder: '留空用默认 OpenAI 端点' },
      ],
    }]
  },
  validate() { return [] },
}

// ── Anthropic ──
export const anthropic: ProviderConfig = {
  id: 'anthropic',
  label: 'Anthropic',
  models: [
    { id: 'claude-opus-4-8', label: 'Claude Opus 4.8' },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  ],
  defaultEnv: {},
  buildEnv(c: Record<string, unknown>): Record<string, string> {
    const env: Record<string, string> = {}
    if (c.anthropicApiKey) env['ANTHROPIC_API_KEY'] = c.anthropicApiKey as string
    if (c.anthropicBaseUrl) env['ANTHROPIC_BASE_URL'] = c.anthropicBaseUrl as string
    return env
  },
  getFormSchema() {
    return [{
      id: 'anthropic-model', label: '模型选择', fields: [{
        key: 'anthropicModel', label: '默认模型', type: 'select', defaultValue: 'claude-sonnet-4-6',
        required: true, options: this.models.map(m => ({ label: m.label, value: m.id })),
      }],
    }, {
      id: 'anthropic-auth', label: 'API 连接', fields: [
        { key: 'anthropicApiKey', label: 'API Key', type: 'string', defaultValue: '', required: false, placeholder: 'sk-ant-...' },
        { key: 'anthropicBaseUrl', label: 'Base URL（可选）', type: 'string', defaultValue: '', required: false },
      ],
    }]
  },
  validate() { return [] },
}

// ── DeepSeek (走 openai_legacy 协议) ──
export const deepseek: ProviderConfig = {
  id: 'deepseek',
  label: 'DeepSeek (OpenAI 兼容)',
  models: [
    { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
    { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  ],
  defaultEnv: {},
  buildEnv(c: Record<string, unknown>): Record<string, string> {
    const env: Record<string, string> = {}
    env['OPENAI_BASE_URL'] = (c.dsEndpoint as string) || 'https://api.deepseek.com/v1'
    if (c.dsApiKey) env['OPENAI_API_KEY'] = c.dsApiKey as string
    return env
  },
  getFormSchema() {
    return [{
      id: 'ds-model', label: '模型选择', fields: [{
        key: 'dsModel', label: '默认模型', type: 'select', defaultValue: 'deepseek-v4-pro',
        required: true, options: this.models.map(m => ({ label: m.label, value: m.id })),
      }],
    }, {
      id: 'ds-auth', label: 'API 连接', fields: [
        { key: 'dsEndpoint', label: 'Base URL', type: 'string', defaultValue: 'https://api.deepseek.com/v1', required: true },
        { key: 'dsApiKey', label: 'API Key', type: 'string', defaultValue: '', required: false, placeholder: 'sk-...' },
      ],
    }]
  },
  validate() { return [] },
}
