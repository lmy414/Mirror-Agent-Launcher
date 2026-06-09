import { describe, it, expect, vi } from 'vitest'
import type { ElectronAPI } from '../../main/preload'

function mockAPI(): ElectronAPI {
  return {
    window: {
      minimize: vi.fn(),
      maximize: vi.fn(),
      close: vi.fn(),
    },
    config: {
      list: vi.fn().mockResolvedValue([
        { toolId: 'claude-code', displayName: 'Claude Code', installed: true },
        { toolId: 'my-tool', displayName: 'My Tool', installed: false },
      ]),
      read: vi.fn().mockResolvedValue({
        ok: true,
        data: { config: { model: 'sonnet' }, valid: true, errors: [] },
      }),
      write: vi.fn().mockResolvedValue({
        ok: true,
        data: { valid: true, errors: [] },
      }),
      schema: vi.fn().mockResolvedValue({
        ok: true,
        data: { sections: [{ id: 'main', label: 'Main', fields: [] }] },
      }),
      openFile: vi.fn().mockResolvedValue({ ok: true, data: { opened: true } }),
      providers: vi.fn().mockResolvedValue({ ok: true, data: [] }),
    },
    agent: {
      spawn: vi.fn().mockResolvedValue({ ok: true, data: { sessionId: 'sess-1' } }),
      stop: vi.fn().mockResolvedValue({ ok: true }),
      list: vi.fn().mockResolvedValue({ ok: true, data: { running: [] } }),
      add: vi.fn().mockResolvedValue({ ok: true }),
      remove: vi.fn().mockResolvedValue({ ok: true }),
      install: vi.fn().mockResolvedValue({ ok: true, data: { installed: true } }),
      uninstall: vi.fn().mockResolvedValue({ ok: true, data: { installed: false } }),
    },
    dialog: {
      openDirectory: vi.fn().mockResolvedValue('D:\\test-dir'),
    },
    terminal: {
      stdin: vi.fn(),
      resize: vi.fn(),
      onStdout: vi.fn().mockReturnValue(vi.fn()),
      onExit: vi.fn().mockReturnValue(vi.fn()),
    },
    log: {
      push: vi.fn(),
      getRecent: vi.fn(),
      onStream: vi.fn().mockReturnValue(vi.fn()),
    },
    runtime: {
      onUpdate: vi.fn().mockReturnValue(vi.fn()),
    },
    settings: {
      getAll: vi.fn().mockResolvedValue({ ok: true, data: {} }),
      set: vi.fn().mockResolvedValue({ ok: true }),
    },
    clipboard: {
      readText: vi.fn().mockResolvedValue('test clipboard'),
    },
  }
}

type IpcClientModule = typeof import('@/bridge/ipc-client')

async function getClient(): Promise<IpcClientModule> {
  vi.stubGlobal('window', { electronAPI: mockAPI() })
  return import('@/bridge/ipc-client')
}

describe('IPC Client', () => {
  describe('config module', () => {
    it('configList: 返回适配器列表', async () => {
      const { configList } = await getClient()
      const list = await configList()
      expect(list).toHaveLength(2)
      expect(list[0].toolId).toBe('claude-code')
    })

    it('configRead: 读取配置', async () => {
      const { configRead } = await getClient()
      const result = await configRead('claude-code')
      expect(result.ok).toBe(true)
      expect(result.data?.config.model).toBe('sonnet')
    })

    it('configWrite: 写入配置', async () => {
      const { configWrite } = await getClient()
      const result = await configWrite('claude-code', { model: 'opus' })
      expect(result.ok).toBe(true)
    })
  })

  describe('agent module', () => {
    it('agentSpawn: 返回 sessionId', async () => {
      const { agentSpawn } = await getClient()
      const result = await agentSpawn('claude-code')
      expect(result.ok).toBe(true)
      expect(result.data?.sessionId).toBe('sess-1')
    })

    it('agentStop: 停止 session', async () => {
      const { agentStop } = await getClient()
      const result = await agentStop('sess-1')
      expect(result.ok).toBe(true)
    })

    it('agentAdd: 添加自定义适配器', async () => {
      const { agentAdd } = await getClient()
      const result = await agentAdd('my-tool', 'My Tool')
      expect(result.ok).toBe(true)
    })
  })

  describe('terminal module', () => {
    it('terminalStdin: 发送输入不抛出', async () => {
      const { terminalStdin } = await getClient()
      expect(() => terminalStdin('sess-1', 'hello\n')).not.toThrow()
    })

    it('terminalResize: 调整尺寸不抛出', async () => {
      const { terminalResize } = await getClient()
      expect(() => terminalResize('sess-1', 120, 40)).not.toThrow()
    })
  })
})
