/** 配置字段类型 */
export interface ConfigField {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'path'
  description?: string
  defaultValue: unknown
  required: boolean
  options?: { label: string; value: string }[]
  placeholder?: string
}

/** 配置分区 */
export interface ConfigSection {
  id: string
  label: string
  description?: string
  fields: ConfigField[]
}

/** 模型厂商/提供商配置 */
export interface ProviderConfig {
  /** 厂商 ID，如 'anthropic' | 'deepseek' */
  id: string
  /** 显示名称 */
  label: string
  /** 可用模型列表 */
  models: { id: string; label: string }[]
  /** 默认注入的环境变量 */
  defaultEnv: Record<string, string>
  /** 从用户配置构建运行时环境变量 */
  buildEnv(userConfig: Record<string, unknown>): Record<string, string>
  /** 返回该厂商的配置表单 schema */
  getFormSchema(): ConfigSection[]
  /** 校验用户配置 */
  validate(config: Record<string, unknown>): string[]
}

/** CLI 工具适配器接口 */
export interface ConfigAdapter {
  toolId: string
  displayName: string

  /** 返回配置表单 schema */
  getConfigSchema(): ConfigSection[]

  /** 检测工具是否已安装 */
  detect(): boolean

  /** 读取原生配置文件，返回展平的 key-value */
  read(): Record<string, unknown>

  /** 写入部分配置（内部 read-merge-write） */
  write(partialConfig: Record<string, unknown>): void

  /** 校验配置 */
  validate(config: Record<string, unknown>): { valid: boolean; errors: string[] }

  /** 返回启动命令 */
  getCommand(config: Record<string, unknown>): {
    command: string
    args: string[]
    cwd: string
    env: Record<string, string>
  }

  /** 返回该工具支持的厂商列表（可选，不支持返回空数组） */
  getProviders?(): ProviderConfig[]

  /** 返回原生配置文件路径（可选，用于「查看原始配置」） */
  getConfigPath?(): string

  /** 返回安装命令（可选，用于一键安装） */
  getInstallCommand?(): { command: string; args: string[] } | null

  /** 返回卸载命令（可选，用于一键卸载） */
  getUninstallCommand?(): { command: string; args: string[] } | null
}
