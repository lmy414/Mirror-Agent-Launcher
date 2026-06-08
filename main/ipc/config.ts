import { ipcMain } from 'electron'
import { adapterRegistry } from '../adapters/registry'
import { logger } from '../logger'

export function registerConfigIpc(): void {
  ipcMain.handle('config:list', () => {
    logger.info('main', 'config:list')
    return adapterRegistry.discover()
  })

  ipcMain.handle('config:read', (_e, { toolId }: { toolId: string }) => {
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

  ipcMain.handle('config:schema', (_e, { toolId }: { toolId: string }) => {
    const adapter = adapterRegistry.get(toolId)
    if (!adapter) {
      return { ok: false, error: { code: 'ADAPTER_NOT_FOUND', message: `未找到适配器: ${toolId}` } }
    }
    return { ok: true, data: { sections: adapter.getConfigSchema() } }
  })
}
