import { describe, it, expect, beforeEach } from 'vitest'
import { adapterRegistry } from '../registry'
import type { ConfigAdapter, ConfigSection } from '../types'

// 测试用适配器 stub
function stubAdapter(toolId: string, detected = true): ConfigAdapter {
  return {
    toolId,
    displayName: `Test ${toolId}`,
    getConfigSchema(): ConfigSection[] {
      return [{ id: 'main', label: 'Main', fields: [] }]
    },
    detect(): boolean {
      return detected
    },
    read(): Record<string, unknown> {
      return { key: 'value' }
    },
    write(_partial: Record<string, unknown>): void {},
    validate(_config: Record<string, unknown>): { valid: boolean; errors: string[] } {
      return { valid: true, errors: [] }
    },
    getCommand(_config: Record<string, unknown>) {
      return { command: toolId, args: [], cwd: '/', env: {} }
    },
  }
}

describe('ConfigAdapterRegistry', () => {
  beforeEach(() => {
    // 清理所有注册的适配器（按 toolId 逐个 unregister）
    for (const a of adapterRegistry.getAll()) {
      adapterRegistry.unregister(a.toolId)
    }
  })

  it('register: 注册适配器', () => {
    const a = stubAdapter('test-tool')
    adapterRegistry.register(a)
    expect(adapterRegistry.get('test-tool')).toBe(a)
  })

  it('register: 重复注册应抛出', () => {
    adapterRegistry.register(stubAdapter('dup'))
    expect(() => adapterRegistry.register(stubAdapter('dup'))).toThrow('already registered')
  })

  it('get: 未注册返回 undefined', () => {
    expect(adapterRegistry.get('nonexistent')).toBeUndefined()
  })

  it('getAll: 返回所有已注册适配器', () => {
    adapterRegistry.register(stubAdapter('a'))
    adapterRegistry.register(stubAdapter('b'))
    expect(adapterRegistry.getAll()).toHaveLength(2)
  })

  it('unregister: 移除适配器', () => {
    adapterRegistry.register(stubAdapter('rm'))
    adapterRegistry.unregister('rm')
    expect(adapterRegistry.get('rm')).toBeUndefined()
  })

  it('discover: 返回安装状态', () => {
    adapterRegistry.register(stubAdapter('installed', true))
    adapterRegistry.register(stubAdapter('missing', false))
    const result = adapterRegistry.discover()
    expect(result).toEqual([
      { toolId: 'installed', displayName: 'Test installed', installed: true },
      { toolId: 'missing', displayName: 'Test missing', installed: false },
    ])
  })
})
