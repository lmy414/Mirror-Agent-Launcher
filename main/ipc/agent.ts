import { ipcMain } from 'electron'
import { ptyManager } from '../pty/manager'
import { adapterRegistry } from '../adapters/registry'
import { GenericAdapter } from '../adapters/generic'
import { logger } from '../logger'

export function registerAgentIpc(): void {
  ipcMain.handle('agent:spawn', (_e, { toolId, sessionId, displayName }: { toolId: string; sessionId?: string; displayName?: string }) => {
    const adapter = adapterRegistry.get(toolId)
    if (!adapter) {
      return { ok: false, error: { code: 'ADAPTER_NOT_FOUND', message: `未找到适配器: ${toolId}` } }
    }

    try {
      const config = adapter.read()
      const { command, args, cwd, env } = adapter.getCommand(config)

      const session = ptyManager.spawn(toolId, {
        command,
        args,
        cwd,
        env,
        cols: 120,
        rows: 40,
        id: sessionId,
        displayName: displayName || adapter.displayName,
      })

      return { ok: true, data: { sessionId: session.id } }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error('main', 'agent:spawn 失败', { toolId, error: msg })
      return { ok: false, error: { code: 'AGENT_SPAWN_ERROR', message: msg } }
    }
  })

  ipcMain.handle('agent:stop', (_e, { sessionId }: { sessionId: string }) => {
    ptyManager.kill(sessionId)
    return { ok: true }
  })

  ipcMain.handle('agent:list', () => {
    return {
      ok: true,
      data: {
        running: ptyManager.list().map((s) => ({
          sessionId: s.id,
          toolId: s.toolId,
          startedAt: s.startedAt,
          pid: s.pid,
        })),
      },
    }
  })

  // 动态添加通用适配器
  ipcMain.handle('agent:add', (_e, { toolId, displayName }: { toolId: string; displayName: string }) => {
    if (adapterRegistry.get(toolId)) {
      return { ok: false, error: { code: 'DUPLICATE', message: `适配器 ${toolId} 已存在` } }
    }
    const adapter = new GenericAdapter(toolId, displayName)
    adapterRegistry.register(adapter)
    logger.info('main', 'agent:add 新适配器', { toolId, displayName })
    return { ok: true }
  })

  // 移除动态适配器
  ipcMain.handle('agent:remove', (_e, { toolId }: { toolId: string }) => {
    const adapter = adapterRegistry.get(toolId)
    if (!adapter) {
      return { ok: false, error: { code: 'ADAPTER_NOT_FOUND', message: `未找到适配器: ${toolId}` } }
    }
    // 仅允许移除 GenericAdapter（内置的 ClaudeCodeAdapter 不可移除）
    if (!(adapter instanceof GenericAdapter)) {
      return { ok: false, error: { code: 'FORBIDDEN', message: '内置适配器不可移除' } }
    }
    adapterRegistry.unregister(toolId)
    logger.info('main', 'agent:remove 适配器已移除', { toolId })
    return { ok: true }
  })
}
