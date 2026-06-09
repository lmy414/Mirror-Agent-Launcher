import { spawn, IPty } from 'node-pty'
import { type WebContents } from 'electron'
import { logger } from '../logger'
import { runtimeTracker } from '../runtime/tracker'

export interface PtySession {
  id: string
  toolId: string
  pty: IPty
  startedAt: number
  pid: number
}

class PtyManager {
  private sessions = new Map<string, PtySession>()
  private sessionOwners = new Map<string, WebContents>()

  spawn(toolId: string, opts: { command: string; args: string[]; cwd: string; env: Record<string, string>; cols?: number; rows?: number; id?: string; displayName?: string }, owner: WebContents): PtySession {
    const id = opts.id || `pty-${toolId}-${Date.now()}`

    const spawnEnv = { ...opts.env, TERM: 'xterm-256color' }

    const pty = spawn(opts.command, opts.args, {
      cwd: opts.cwd,
      env: spawnEnv,
      cols: opts.cols ?? 120,
      rows: opts.rows ?? 40,
    })

    const session: PtySession = {
      id,
      toolId,
      pty,
      startedAt: Date.now(),
      pid: pty.pid,
    }

    this.sessions.set(id, session)
    this.sessionOwners.set(id, owner)

    // 运行记录 — 开始
    runtimeTracker.start(id, toolId, opts.displayName || toolId, owner)

    // stdout → 拥有者渲染进程 + token 解析
    pty.onData((data: string) => {
      runtimeTracker.feed(id, data)
      const sender = this.sessionOwners.get(id)
      if (sender && !sender.isDestroyed()) {
        sender.send('terminal:stdout', { sessionId: id, data })
      }
    })

    // 进程退出
    pty.onExit(({ exitCode, signal }) => {
      runtimeTracker.end(id, exitCode)
      const sender = this.sessionOwners.get(id)
      if (sender && !sender.isDestroyed()) {
        sender.send('terminal:exit', {
          sessionId: id,
          exitCode,
          signal: signal != null ? String(signal) : null,
        })
      }
      this.sessions.delete(id)
      this.sessionOwners.delete(id)
      logger.info(`pty:${id}`, '进程退出', { exitCode, signal, toolId })
    })

    logger.info(`pty:${id}`, '进程已启动', { toolId, pid: pty.pid, cmd: opts.command })
    return session
  }

  write(sessionId: string, data: string, sender?: WebContents): void {
    if (sender) {
      const owner = this.sessionOwners.get(sessionId)
      if (owner?.id !== sender.id) return
    }
    const session = this.sessions.get(sessionId)
    if (session) {
      session.pty.write(data)
    }
  }

  resize(sessionId: string, cols: number, rows: number, sender?: WebContents): void {
    if (sender) {
      const owner = this.sessionOwners.get(sessionId)
      if (owner?.id !== sender.id) return
    }
    const session = this.sessions.get(sessionId)
    if (session) {
      session.pty.resize(cols, rows)
    }
  }

  kill(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.pty.kill()
      this.sessions.delete(sessionId)
    }
  }

  killAll(): void {
    for (const [id, session] of this.sessions) {
      session.pty.kill()
      this.sessions.delete(id)
    }
  }

  list(): PtySession[] {
    return Array.from(this.sessions.values())
  }

  get(sessionId: string): PtySession | undefined {
    return this.sessions.get(sessionId)
  }
}

export const ptyManager = new PtyManager()
