import { type WebContents } from 'electron'
import { logger } from '../logger'

export interface RuntimeRecord {
  sessionId: string
  toolId: string
  displayName: string
  startedAt: number
  endedAt?: number
  exitCode?: number
  tokensIn: number
  tokensOut: number
}

class RuntimeTracker {
  private sessions = new Map<string, RuntimeRecord>()
  private sessionOwners = new Map<string, WebContents>()

  start(sessionId: string, toolId: string, displayName: string, owner: WebContents): void {
    this.sessions.set(sessionId, {
      sessionId,
      toolId,
      displayName,
      startedAt: Date.now(),
      tokensIn: 0,
      tokensOut: 0,
    })
    this.sessionOwners.set(sessionId, owner)
    this.broadcast()
    logger.info('runtime', '会话开始', { sessionId, toolId })
  }

  end(sessionId: string, exitCode: number): void {
    const s = this.sessions.get(sessionId)
    if (s) {
      s.endedAt = Date.now()
      s.exitCode = exitCode
      this.broadcast()
      logger.info('runtime', '会话结束', {
        sessionId,
        duration: s.endedAt - s.startedAt,
        tokensIn: s.tokensIn,
        tokensOut: s.tokensOut,
      })
    }
    this.sessionOwners.delete(sessionId)
  }

  /** 解析终端输出中的 token 信息，自动累加 */
  feed(sessionId: string, data: string): void {
    const s = this.sessions.get(sessionId)
    if (!s) return

    // Claude Code / 常见 LLM 工具 token 输出格式：
    //   "input: 12.3k" / "12.3k input" / "Input tokens: 12345"
    //   "output: 456"  / "456 output" / "Output tokens: 456"
    //   "Tokens: 12345 (input: 12000, output: 345)"
    const inputMatch = data.match(/(?:input|输入)[:\s]*(\d[\d,.]*)\s*k?/i)
    const outputMatch = data.match(/(?:output|输出)[:\s]*(\d[\d,.]*)\s*k?/i)

    if (inputMatch) {
      const val = this.parseNum(inputMatch[1])
      if (val > 0) s.tokensIn = val // 取最新值
    }
    if (outputMatch) {
      const val = this.parseNum(outputMatch[1])
      if (val > 0) s.tokensOut = val
    }

    if (inputMatch || outputMatch) {
      this.broadcast()
    }
  }

  private parseNum(s: string): number {
    const cleaned = s.replace(/,/g, '').trim()
    const n = parseFloat(cleaned)
    if (cleaned.endsWith('k') || cleaned.endsWith('K')) {
      return Math.round(n * 1000)
    }
    return Math.round(n)
  }

  getAll(): RuntimeRecord[] {
    return Array.from(this.sessions.values())
  }

  private broadcast(): void {
    const list = this.getAll()
    for (const [sessionId, owner] of this.sessionOwners) {
      if (!owner.isDestroyed()) {
        owner.send('runtime:update', list)
      }
    }
  }
}

export const runtimeTracker = new RuntimeTracker()
