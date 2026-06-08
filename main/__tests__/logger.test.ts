import { describe, it, expect, vi } from 'vitest'

// Mock electron BrowserWindow
vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: () => [],
  },
}))

import { logger } from '../logger'

describe('Logger', () => {
  it('info: 格式化正确', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    logger.info('main', '测试消息', { key: 'val' })
    expect(spy).toHaveBeenCalledTimes(1)
    const output = spy.mock.calls[0][0] as string
    expect(output).toContain('[main]')
    expect(output).toContain('[INFO]')
    expect(output).toContain('测试消息')
    expect(output).toContain('"key":"val"')
    spy.mockRestore()
  })

  it('warn: 格式化正确', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    logger.warn('pty:test', '超时警告')
    const output = spy.mock.calls[0][0] as string
    expect(output).toContain('[pty:test]')
    expect(output).toContain('[WARN]')
    spy.mockRestore()
  })

  it('error: 格式化正确', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    logger.error('main', '致命错误', { code: 500 })
    const output = spy.mock.calls[0][0] as string
    expect(output).toContain('[ERROR]')
    expect(output).toContain('致命错误')
    spy.mockRestore()
  })

  it('getRecent: 返回最近 N 条日志', () => {
    for (let i = 0; i < 10; i++) {
      logger.info('test', `log-${i}`)
    }
    const recent = logger.getRecent(5)
    expect(recent).toHaveLength(5)
    expect(recent[0].message).toBe('log-5')
    expect(recent[4].message).toBe('log-9')
  })

  it('buffer: 超过 1000 条时丢弃最旧的', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    for (let i = 0; i < 1100; i++) {
      logger.info('test', `log-${i}`)
    }
    const recent = logger.getRecent(1)
    expect(recent[0].message).toBe('log-1099')
    // 缓冲区上限为 1000
    expect(logger.getRecent(2000).length).toBeLessThanOrEqual(1000)
    spy.mockRestore()
  })
})
