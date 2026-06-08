import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import path from 'path'
import os from 'os'

const STABLE_DIR = path.join(os.tmpdir(), 'mio-test-generic')

// Mock electron app.getPath — stable path across calls
vi.mock('electron', () => ({
  app: {
    getPath(_name: string): string {
      return STABLE_DIR
    },
  },
}))

import { GenericAdapter } from '../generic'

describe('GenericAdapter', () => {
  let adapter: GenericAdapter
  const uniqueId = `tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  beforeEach(() => {
    adapter = new GenericAdapter(uniqueId, 'My Tool')
  })

  it('toolId 和 displayName 正确设置', () => {
    expect(adapter.toolId).toBe(uniqueId)
    expect(adapter.displayName).toBe('My Tool')
  })

  it('detect: 始终返回 false', () => {
    expect(adapter.detect()).toBe(false)
  })

  it('read: 新适配器返回空对象', () => {
    expect(adapter.read()).toEqual({})
  })

  it('write + read: 写入后成功读取', () => {
    adapter.write({ command: 'myapp', cwd: '/test' })
    const config = adapter.read()
    expect(config.command).toBe('myapp')
    expect(config.cwd).toBe('/test')
  })

  it('write: 部分更新不覆盖未修改字段', () => {
    adapter.write({ command: 'myapp', cwd: '/a' })
    adapter.write({ cwd: '/b' })
    const config = adapter.read()
    expect(config.command).toBe('myapp')  // unchanged
    expect(config.cwd).toBe('/b')         // changed
  })

  it('validate: command 为空时返回错误', () => {
    const result = adapter.validate({})
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('启动命令')
  })

  it('validate: command 存在时通过', () => {
    const result = adapter.validate({ command: 'myapp' })
    expect(result.valid).toBe(true)
  })

  it('getCommand: 解析命令和参数', () => {
    const cmd = adapter.getCommand({ command: 'myapp', args: '--verbose --port 3000', cwd: '/app' })
    expect(cmd.command).toBe('myapp')
    expect(cmd.args).toEqual(['--verbose', '--port', '3000'])
    expect(cmd.cwd).toBe('/app')
  })

  it('getCommand: 无 args 时返回空数组', () => {
    const cmd = adapter.getCommand({ command: 'simple' })
    expect(cmd.args).toEqual([])
  })

  it('getConfigSchema: 返回启动配置 + 环境变量两个分区', () => {
    const schema = adapter.getConfigSchema()
    expect(schema).toHaveLength(2)
    expect(schema[0].id).toBe('launch')
    expect(schema[1].id).toBe('env')
  })
})
