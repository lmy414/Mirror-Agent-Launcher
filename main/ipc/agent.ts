import { ipcMain } from 'electron'
import { spawn } from 'child_process'
import { ptyManager } from '../pty/manager'
import { adapterRegistry } from '../adapters/registry'
import { GenericAdapter } from '../adapters/generic'
import { logger } from '../logger'
import { validateToolId } from '../utils/validation'

/** 后台等待完成的 spawn，UTF-8 解码，超时强杀 */
function runCommand(command: string, args: string[], timeout: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    })
    let stdout = '', stderr = ''
    proc.stdout?.on('data', (c: Buffer) => { stdout += c.toString('utf-8') })
    proc.stderr?.on('data', (c: Buffer) => { stderr += c.toString('utf-8') })
    const timer = setTimeout(() => { proc.kill(); reject(new Error(`超时 ${timeout / 1000}s`)) }, timeout)
    proc.on('close', (code) => {
      clearTimeout(timer)
      code === 0 ? resolve(stdout) : reject(new Error(stderr || stdout || `退出码 ${code}`))
    })
    proc.on('error', (err) => { clearTimeout(timer); reject(err) })
  })
}

/** 安装/卸载命令：打开可见终端窗口执行，用户自主交互 */
function runInstallCommand(command: string, args: string[], _timeout: number): Promise<string> {
  return new Promise((resolve, reject) => {
    // Windows: 打开新的 PowerShell 窗口
    const finalArgs = process.platform === 'win32'
      ? ['/c', 'start', '"Install"', command, ...args]
      : [command, ...args]
    const proc = spawn(process.platform === 'win32' ? 'cmd.exe' : command, finalArgs, {
      stdio: 'ignore',
      detached: true,
    })
    proc.unref()
    // 不等待——用户在新窗口中自主操作
    resolve('')
    proc.on('error', reject)
  })
}

export function registerAgentIpc(): void {
  ipcMain.handle('agent:spawn', (event, { toolId, sessionId, displayName, cwd: customCwd }: { toolId: string; sessionId?: string; displayName?: string; cwd?: string }) => {
    if (!validateToolId(toolId)) {
      return { ok: false, error: { code: 'INVALID_TOOL_ID', message: 'toolId 包含非法字符' } }
    }
    const adapter = adapterRegistry.get(toolId)
    if (!adapter) {
      return { ok: false, error: { code: 'ADAPTER_NOT_FOUND', message: `未找到适配器: ${toolId}` } }
    }

    try {
      const config = adapter.read()
      const { command, args, cwd, env } = adapter.getCommand(config)
      const finalCwd = customCwd || cwd

      const session = ptyManager.spawn(toolId, {
        command,
        args,
        cwd: finalCwd,
        env,
        cols: 120,
        rows: 40,
        id: sessionId,
        displayName: displayName || adapter.displayName,
      }, event.sender)

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

  ipcMain.handle('agent:install', async (_e, { toolId }: { toolId: string }) => {
    if (!validateToolId(toolId)) {
      return { ok: false, error: { code: 'INVALID_TOOL_ID', message: 'toolId 包含非法字符' } }
    }
    const adapter = adapterRegistry.get(toolId)
    if (!adapter?.getInstallCommand) {
      return { ok: false, error: { code: 'NO_INSTALL', message: `适配器 ${toolId} 不支持一键安装` } }
    }
    try {
      const cmd = adapter.getInstallCommand()!
      logger.info('main', `agent:install ${toolId}`, { command: cmd.command, args: cmd.args })
      // npm 等无交互命令 → 后台等待完成；powershell 等需要交互 → 弹窗
      const isInteractive = cmd.command === 'powershell'
      if (isInteractive) {
        await runInstallCommand(cmd.command, cmd.args, 300000)
        return { ok: true, data: { installed: false, launched: true } }
      }
      await runCommand(cmd.command, cmd.args, 300000)
      return { ok: true, data: { installed: adapter.detect() } }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error('main', `agent:install ${toolId} 失败`, { error: msg })
      return { ok: false, error: { code: 'INSTALL_ERROR', message: msg } }
    }
  })

  ipcMain.handle('agent:uninstall', async (_e, { toolId }: { toolId: string }) => {
    if (!validateToolId(toolId)) {
      return { ok: false, error: { code: 'INVALID_TOOL_ID', message: 'toolId 包含非法字符' } }
    }
    const adapter = adapterRegistry.get(toolId)
    if (!adapter?.getUninstallCommand) {
      return { ok: false, error: { code: 'NO_UNINSTALL', message: `适配器 ${toolId} 不支持一键卸载` } }
    }
    try {
      const cmd = adapter.getUninstallCommand()!
      logger.info('main', `agent:uninstall ${toolId}`, { command: cmd.command, args: cmd.args })
      const isInteractive = cmd.command === 'powershell'
      if (isInteractive) {
        await runInstallCommand(cmd.command, cmd.args, 120000)
        return { ok: true, data: { installed: true, launched: true } }
      }
      await runCommand(cmd.command, cmd.args, 120000)
      return { ok: true, data: { installed: adapter.detect() } }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error('main', `agent:uninstall ${toolId} 失败`, { error: msg })
      return { ok: false, error: { code: 'UNINSTALL_ERROR', message: msg } }
    }
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
    if (!validateToolId(toolId)) {
      return { ok: false, error: { code: 'INVALID_TOOL_ID', message: 'toolId 包含非法字符' } }
    }
    if (typeof displayName !== 'string' || displayName.length === 0 || displayName.length > 128) {
      return { ok: false, error: { code: 'INVALID_DISPLAY_NAME', message: 'displayName 格式不正确' } }
    }
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
    if (!validateToolId(toolId)) {
      return { ok: false, error: { code: 'INVALID_TOOL_ID', message: 'toolId 包含非法字符' } }
    }
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
