import { ipcMain } from 'electron'
import { adapterRegistry } from '../adapters/registry'
import { logger } from '../logger'
import { validateToolId } from '../utils/validation'

export function registerConfigIpc(): void {
  ipcMain.handle('config:list', () => {
    logger.info('main', 'config:list')
    return adapterRegistry.discover()
  })

  ipcMain.handle('config:read', (_e, { toolId }: { toolId: string }) => {
    if (!validateToolId(toolId)) {
      return { ok: false, error: { code: 'INVALID_TOOL_ID', message: 'toolId 包含非法字符' } }
    }
    logger.info('main', 'config:read', { toolId })
    const adapter = adapterRegistry.get(toolId)
    if (!adapter) {
      return { ok: false, error: { code: 'ADAPTER_NOT_FOUND', message: `未找到适配器: ${toolId}` } }
    }
    try {
      const config = adapter.read()
      const validation = adapter.validate(config)
      return { ok: true, data: { config, valid: validation.valid, errors: validation.errors } }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error('main', 'config:read 失败', { toolId, error: msg })
      return { ok: false, error: { code: 'CONFIG_READ_ERROR', message: msg } }
    }
  })

  ipcMain.handle('config:write', (_e, { toolId, partialConfig }: { toolId: string; partialConfig: Record<string, unknown> }) => {
    if (!validateToolId(toolId)) {
      return { ok: false, error: { code: 'INVALID_TOOL_ID', message: 'toolId 包含非法字符' } }
    }
    logger.info('main', 'config:write', { toolId, fields: Object.keys(partialConfig) })
    const adapter = adapterRegistry.get(toolId)
    if (!adapter) {
      return { ok: false, error: { code: 'ADAPTER_NOT_FOUND', message: `未找到适配器: ${toolId}` } }
    }
    try {
      adapter.write(partialConfig)
      // 回读校验
      const config = adapter.read()
      const validation = adapter.validate(config)
      return { ok: true, data: { valid: validation.valid, errors: validation.errors } }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error('main', 'config:write 失败', { toolId, error: msg })
      return { ok: false, error: { code: 'CONFIG_WRITE_ERROR', message: msg } }
    }
  })

  ipcMain.handle('config:providers', (_e, { toolId }: { toolId: string }) => {
    if (!validateToolId(toolId)) {
      return { ok: false, error: { code: 'INVALID_TOOL_ID', message: 'toolId 包含非法字符' } }
    }
    const adapter = adapterRegistry.get(toolId)
    if (!adapter) {
      return { ok: false, error: { code: 'ADAPTER_NOT_FOUND', message: `未找到适配器: ${toolId}` } }
    }
    const providers = adapter.getProviders?.() ?? []
    return {
      ok: true,
      data: providers.map((p) => ({
        id: p.id,
        label: p.label,
        models: p.models,
        sections: p.getFormSchema(),
      })),
    }
  })

  ipcMain.handle('config:openFile', async (_e, { toolId }: { toolId: string }) => {
    if (!validateToolId(toolId)) {
      return { ok: false, error: { code: 'INVALID_TOOL_ID', message: 'toolId 包含非法字符' } }
    }
    const adapter = adapterRegistry.get(toolId)
    if (!adapter) {
      return { ok: false, error: { code: 'ADAPTER_NOT_FOUND', message: `未找到适配器: ${toolId}` } }
    }
    try {
      const configPath = (adapter as any).configPath?.()
      if (configPath) {
        const { shell } = await import('electron')
        const err = await shell.openPath(configPath)
        return { ok: true, data: { opened: err === '' } }
      }
      return { ok: false, error: { code: 'NO_CONFIG_PATH', message: '该适配器无配置文件路径' } }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { ok: false, error: { code: 'OPEN_ERROR', message: msg } }
    }
  })

  ipcMain.handle('config:schema', (_e, { toolId }: { toolId: string }) => {
    if (!validateToolId(toolId)) {
      return { ok: false, error: { code: 'INVALID_TOOL_ID', message: 'toolId 包含非法字符' } }
    }
    const adapter = adapterRegistry.get(toolId)
    if (!adapter) {
      return { ok: false, error: { code: 'ADAPTER_NOT_FOUND', message: `未找到适配器: ${toolId}` } }
    }
    return { ok: true, data: { sections: adapter.getConfigSchema() } }
  })
}
