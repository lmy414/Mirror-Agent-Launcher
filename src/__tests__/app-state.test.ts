import { describe, it, expect } from 'vitest'
import { useAppState } from '@/shell/app-state'

describe('AppState', () => {
  it('agents: 初始为空', () => {
    const state = useAppState()
    expect(state.agents()).toEqual([])
  })

  it('setAgents: 设置 agent 列表', () => {
    const state = useAppState()
    state.setAgents([
      { toolId: 'test', displayName: 'Test', installed: true },
    ])
    expect(state.agents()).toHaveLength(1)
    expect(state.agents()[0].toolId).toBe('test')
  })

  it('runningAgents: 初始为空', () => {
    const state = useAppState()
    expect(state.runningAgents()).toEqual([])
  })

  it('setRunningAgents: 设置运行列表', () => {
    const state = useAppState()
    state.setRunningAgents([
      { sessionId: 's1', toolId: 'test', startedAt: 1000, pid: 123 },
    ])
    expect(state.runningAgents()).toHaveLength(1)
    expect(state.runningAgents()[0].pid).toBe(123)
  })

  it('connected: 初始为 false', () => {
    const state = useAppState()
    expect(state.connected()).toBe(false)
  })

  it('appendLog: 追加日志，最多保留 100 条', () => {
    const state = useAppState()
    for (let i = 0; i < 150; i++) {
      state.appendLog({
        time: '00:00:00',
        layer: 'test',
        level: 'INFO',
        message: `log-${i}`,
      })
    }
    // 只保留最近 100 条
    expect(state.sidebarLogs().length).toBeLessThanOrEqual(100)
    expect(state.sidebarLogs()[state.sidebarLogs().length - 1].message).toBe('log-149')
  })
})
