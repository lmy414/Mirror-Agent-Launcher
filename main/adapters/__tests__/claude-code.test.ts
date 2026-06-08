import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { ClaudeCodeAdapter } from '../claude-code'

// Monkey-patch homeDir 指向临时目录
const tmpDir = path.join(os.tmpdir(), 'mio-test-' + Date.now())
const claudeDir = path.join(tmpDir, '.claude')
const settingsPath = path.join(claudeDir, 'settings.json')

describe('ClaudeCodeAdapter', () => {
  let adapter: ClaudeCodeAdapter

  beforeEach(() => {
    fs.mkdirSync(claudeDir, { recursive: true })
    // 注入临时路径
    adapter = new (class extends ClaudeCodeAdapter {
      configPath() { return settingsPath }
    })() as any
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('read: 配置文件不存在时返回默认值', () => {
    const config = adapter.read()
    expect(config.model).toBe('claude-sonnet-4-6')
    expect(config.theme).toBe('dark')
    expect(config.autoCompact).toBe(true)
  })

  it('write + read: 写入配置后成功读取', () => {
    adapter.write({ model: 'claude-opus-4-8' })
    const config = adapter.read()
    expect(config.model).toBe('claude-opus-4-8')
    // 其他默认值保持不变
    expect(config.theme).toBe('dark')
  })

  it('write: 自动创建 ~/.claude 目录', () => {
    fs.rmSync(claudeDir, { recursive: true, force: true })
    adapter.write({ model: 'claude-haiku-4-5-20251001' })
    expect(fs.existsSync(settingsPath)).toBe(true)
    const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(raw.model).toBe('claude-haiku-4-5-20251001')
  })

  it('write: 部分更新不会删除未修改的字段', () => {
    adapter.write({ model: 'claude-opus-4-8', theme: 'light' })
    adapter.write({ theme: 'dark' })
    const config = adapter.read()
    expect(config.model).toBe('claude-opus-4-8')  // unchanged
    expect(config.theme).toBe('dark')               // changed
  })

  it('validate: 有效配置通过', () => {
    const result = adapter.validate({ model: 'claude-sonnet-4-6' })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('validate: 类型错误返回 errors', () => {
    const result = adapter.validate({ model: 123 })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('model'))).toBe(true)
  })

  it('getCommand: 返回 claude 命令', () => {
    const cmd = adapter.getCommand({ cwd: '/test' })
    expect(cmd.command).toMatch(/^claude(\.cmd)?$/)
    expect(cmd.args).toEqual([])
    expect(cmd.cwd).toBe('/test')
  })

  it('getConfigSchema: 返回 3 个分区', () => {
    const schema = adapter.getConfigSchema()
    expect(schema).toHaveLength(3)
    expect(schema[0].id).toBe('general')
    expect(schema[1].id).toBe('api')
    expect(schema[2].id).toBe('hooks')
    expect(schema[0].fields.length).toBeGreaterThan(0)
  })

  it('flatten/unflatten: 嵌套配置正确映射', () => {
    adapter.write({ 'hooks.enabled': false })
    const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(raw.hooks?.enabled).toBe(false)

    const config = adapter.read()
    expect(config['hooks.enabled']).toBe(false)
  })
})
