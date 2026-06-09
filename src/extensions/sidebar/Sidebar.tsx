import { createSignal, createMemo, For, Show, onMount, onCleanup } from 'solid-js'
import { Portal } from 'solid-js/web'
import { Terminal, Plus, Search, Clock, Zap } from 'lucide-solid'
import { addTerminalSession, removeTerminalSession } from '@/shell/app-state'
import { configList, agentSpawn, settingsGetAll, settingsSet, onRuntimeUpdate, type RuntimeRecord } from '@/bridge/ipc-client'
import { WorkingDirPicker } from '@/components/working-dir-picker'
import { formatDuration, formatTokens } from '@/shell/format'

interface AgentEntry {
  toolId: string
  displayName: string
  installed: boolean
}

export function Sidebar() {
  const [agents, setAgents] = createSignal<AgentEntry[]>([])
  const [rawRecords, setRawRecords] = createSignal<RuntimeRecord[]>([])
  const [now, setNow] = createSignal(Date.now())

  // 每次 now 变化时重新计算各记录的时长，展开新数组触发 Solid 重渲染
  const records = createMemo(() => {
    const t = now()
    return rawRecords().map((r) => ({
      ...r,
      _dur: r.endedAt ? r.endedAt - r.startedAt : t - r.startedAt,
    }))
  })
  const [expanded, setExpanded] = createSignal<string[]>([])
  const [searchQuery, setSearchQuery] = createSignal('')
  const [pickerAgent, setPickerAgent] = createSignal<{ toolId: string; displayName: string } | null>(null)

  let interval: ReturnType<typeof setInterval> | undefined

  onMount(async () => {
    const list = await configList()
    setAgents(list)

    onRuntimeUpdate((list) => setRawRecords(list))
    interval = setInterval(() => setNow(Date.now()), 1000)
  })

  onCleanup(() => {
    if (interval) clearInterval(interval)
  })

  const toggleExpand = (id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSpawn = async (agent: AgentEntry) => {
    const allSettings = await settingsGetAll()
    const askKey = `agent:${agent.toolId}:askWorkingDir`
    const lastDirKey = `agent:${agent.toolId}:lastWorkingDir`
    const askWorkingDir = allSettings[askKey] === 'true'
    const lastDir = allSettings[lastDirKey] || ''

    if (askWorkingDir) {
      // 弹出目录选择器
      setPickerAgent({ toolId: agent.toolId, displayName: agent.displayName })
      return
    }

    // 直接启动
    doSpawn(agent.toolId, agent.displayName, lastDir)
  }

  const doSpawn = async (toolId: string, displayName: string, cwd: string) => {
    const sessionId = addTerminalSession(toolId, displayName)
    const result = await agentSpawn(toolId, sessionId, displayName, cwd || undefined)
    if (!result.ok) {
      removeTerminalSession(sessionId)
      console.error('agent:spawn failed', result.error)
    }
  }

  const handlePickerConfirm = async (path: string, _addToGlobal: boolean) => {
    const agent = pickerAgent()
    if (!agent) return
    // 记住上次选择
    await settingsSet(`agent:${agent.toolId}:lastWorkingDir`, path)
    setPickerAgent(null)
    doSpawn(agent.toolId, agent.displayName, path)
  }

  const handlePickerCancel = () => {
    setPickerAgent(null)
  }

  const filtered = () =>
    agents().filter(
      (a) =>
        !searchQuery() ||
        a.displayName.toLowerCase().includes(searchQuery().toLowerCase())
    )

  return (
    <div
      class="glass-panel"
      style={{
        width: '320px',
        'flex-shrink': '0',
        display: 'flex',
        'flex-direction': 'column',
        'z-index': '5',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          padding: '12px 16px',
          height: '54px',
          background: 'rgb(var(--top-bar-tint-rgb))',
          'border-bottom': '1px solid rgba(255,255,255,0.03)',
          'flex-shrink': '0',
        }}
      >
        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
          <Terminal size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ 'font-family': '"Noto Serif SC", serif', 'font-size': '14px', 'font-weight': '600' }}>
            Agent
          </span>
        </div>
        <span style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>
          {agents().filter((a) => a.installed).length}/{agents().length}
        </span>
      </div>
      <div class="divider" />

      {/* Search */}
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '8px',
          padding: '8px 16px',
          height: '40px',
          'flex-shrink': '0',
          'border-bottom': '1px solid rgba(255,255,255,0.03)',
        }}
      >
        <span style={{ color: 'var(--text-muted)', display: 'flex' }}>
          <Search size={14} />
        </span>
        <input
          placeholder="搜索 Agent..."
          value={searchQuery()}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
          style={{
            flex: '1',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            'font-size': '13px',
            'font-family': 'inherit',
            outline: 'none',
          }}
        />
      </div>

      {/* Agent list */}
      <div style={{ flex: '1', 'overflow-y': 'auto', padding: '4px 0', 'min-height': '0' }}>
        <For each={filtered()}>
          {(agent) => (
            <div>
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onClick={() => toggleExpand(agent.toolId)}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    'border-radius': '50%',
                    background: agent.installed ? 'var(--success)' : 'var(--text-muted)',
                    'flex-shrink': '0',
                  }}
                />
                <span style={{ 'font-size': '13px', 'font-weight': '500', color: '#fff' }}>
                  {agent.displayName}
                </span>
                <span style={{ 'margin-left': 'auto', 'font-size': '11px', color: 'var(--text-muted)' }}>
                  {agent.installed ? '已安装' : '未检测到'}
                </span>
              </div>

              <Show when={expanded().includes(agent.toolId)}>
                <div style={{ padding: '0 12px 8px 34px' }}>
                  <button
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      'border-radius': '6px',
                      margin: '0 0 6px 0',
                      background: 'rgba(var(--accent-rgb), 0.1)',
                      border: 'none',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      'font-size': '12px',
                      display: 'flex',
                      'align-items': 'center',
                      gap: '4px',
                      'justify-content': 'center',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSpawn(agent)
                    }}
                  >
                    <Plus size={12} /> 新建终端
                  </button>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>

      {/* 运行记录 */}
      <div
        style={{
          flex: '1',
          display: 'flex',
          'flex-direction': 'column',
          'min-height': '0',
          'border-top': '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div style={{
          display: 'flex', 'align-items': 'center', gap: '6px',
          padding: '8px 16px',
          'border-bottom': '1px solid rgba(255,255,255,0.03)',
        }}>
          <Clock size={12} style={{ color: 'var(--accent)' }} />
          <span style={{ 'font-size': '11px', 'font-weight': '600', color: 'var(--text-muted)' }}>
            运行记录
          </span>
          <span style={{ 'margin-left': 'auto', 'font-size': '10px', color: 'var(--text-muted)' }}>
            {records().filter(r => !r.endedAt).length} 运行中
          </span>
        </div>
        <div style={{ flex: '1', overflow: 'auto' }}>
          <Show
            when={records().length > 0}
            fallback={
              <div style={{
                padding: '16px', 'text-align': 'center',
                'font-size': '11px', color: 'var(--text-muted)', opacity: '0.5',
              }}>
                暂无记录
              </div>
            }
          >
            <For each={records()}>
              {(r) => {
                const running = !r.endedAt
                const dur = (r as any)._dur as number
                return (
                  <div style={{
                    padding: '8px 12px',
                    'border-bottom': '1px solid rgba(255,255,255,0.02)',
                  }}>
                    <div style={{ display: 'flex', 'align-items': 'center', gap: '6px' }}>
                      <div style={{
                        width: '5px', height: '5px', 'border-radius': '50%', 'flex-shrink': '0',
                        background: running ? 'var(--success)' : 'var(--text-muted)',
                      }} />
                      <span style={{ 'font-size': '12px', 'font-weight': '500' }}>{r.displayName}</span>
                    </div>
                    <div style={{
                      'margin-top': '3px',
                      display: 'flex', 'align-items': 'center', gap: '10px',
                      'font-size': '10px', color: 'var(--text-muted)',
                      'font-family': '"JetBrains Mono", monospace',
                    }}>
                      <span>⏱ {formatDuration(dur)}</span>
                      {(r.tokensIn > 0 || r.tokensOut > 0) && (
                        <span>⚡ {formatTokens(r.tokensIn)}/{formatTokens(r.tokensOut)}</span>
                      )}
                      {!running && r.exitCode != null && (
                        <span style={{ color: r.exitCode === 0 ? 'var(--text-muted)' : 'var(--error)' }}>
                          {r.exitCode === 0 ? 'OK' : `err ${r.exitCode}`}
                        </span>
                      )}
                    </div>
                  </div>
                )
              }}
            </For>
          </Show>
        </div>
      </div>

      {/* 工作目录选择弹窗 — Portal 到 body 避免 backdrop-filter 包含块陷阱 */}
      <Show when={pickerAgent()}>
        <Portal mount={document.body}>
          <WorkingDirPicker
            lastDir=""
            onConfirm={handlePickerConfirm}
            onCancel={handlePickerCancel}
          />
        </Portal>
      </Show>
    </div>
  )
}
