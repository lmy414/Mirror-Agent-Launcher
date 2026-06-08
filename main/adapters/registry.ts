import type { ConfigAdapter } from './types'

class ConfigAdapterRegistry {
  private adapters = new Map<string, ConfigAdapter>()

  register(adapter: ConfigAdapter): void {
    if (this.adapters.has(adapter.toolId)) {
      throw new Error(`ConfigAdapter "${adapter.toolId}" already registered`)
    }
    this.adapters.set(adapter.toolId, adapter)
  }

  unregister(toolId: string): void {
    this.adapters.delete(toolId)
  }

  get(toolId: string): ConfigAdapter | undefined {
    return this.adapters.get(toolId)
  }

  getAll(): ConfigAdapter[] {
    return Array.from(this.adapters.values())
  }

  /** 扫描已安装的工具，返回安装状态 */
  discover(): { toolId: string; displayName: string; installed: boolean }[] {
    return this.getAll().map((a) => ({
      toolId: a.toolId,
      displayName: a.displayName,
      installed: a.detect(),
    }))
  }
}

export const adapterRegistry = new ConfigAdapterRegistry()
