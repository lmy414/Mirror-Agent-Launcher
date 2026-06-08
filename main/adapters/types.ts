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
}
