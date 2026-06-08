import { createSignal, For, Show, onMount, onCleanup } from 'solid-js'
import { Activity, Search } from 'lucide-solid'
import { accentRgb } from '@/shell/theme'
import { onLogStream, logGetRecent } from '@/bridge/ipc-client'

interface LogEntry {
  time: string
  layer: string
  level: 'INFO' | 'WARN' | 'ERROR'
  message: string
  context?: Record<string, unknown>
}

export default function LogsView() {
  const [logs, setLogs] = createSignal<LogEntry[]>([])
  const [searchQuery, setSearchQuery] = createSignal('')
  const [levelFilter, setLevelFilter] = createSignal<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL')

  onMount(() => {
    // 先拉取历史日志
    logGetRecent()

    const unsub = onLogStream((entry: unknown) => {
      setLogs((prev) => {
        const next = [...prev, entry as LogEntry]
        if (next.length > 50) next.splice(0, next.length - 50)
        return next
      })
    })
    onCleanup(unsub)
  })

  const filtered = () => {
    let list = logs()
    if (levelFilter() !== 'ALL') {
      list = list.filter((l) => l.level === levelFilter())
    }
    if (searchQuery()) {
      const q = searchQuery().toLowerCase()
      list = list.filter((l) => l.message.toLowerCase().includes(q) || l.layer.toLowerCase().includes(q))
    }
    return list
  }

  const levelColor = (lvl: string) => {
    switch (lvl) {
      case 'INFO': return 'var(--success)'
      case 'WARN': return 'var(--warning)'
      case 'ERROR': return 'var(--error)'
      default: return 'var(--text-muted)'
    }
  }

  const levelCounts = () => ({
    INFO: logs().filter((l) => l.level === 'INFO').length,
    WARN: logs().filter((l) => l.level === 'WARN').length,
    ERROR: logs().filter((l) => l.level === 'ERROR').length,
  })

  return (
    <div class="glass-panel-full" style={{ display: 'flex' }}>
      {/* Left: filter panel */}
      <div style={{
        width: '260px', 'flex-shrink': '0', display: 'flex', 'flex-direction': 'column',
        'border-right': '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          display: 'flex', 'align-items': 'center', padding: '12px 16px', height: '54px',
          'font-family': '"Noto Serif SC", serif',
          'font-size': '15px', 'font-weight': '600',
          background: 'rgb(var(--top-bar-tint-rgb))',
          'border-bottom': '1px solid rgba(255,255,255,0.03)', 'flex-shrink': '0',
        }}>日志</div>

        {/* Search */}
        <div style={{
          display: 'flex', 'align-items': 'center', gap: '8px', padding: '8px 16px', height: '40px',
          'flex-shrink': '0', 'border-bottom': '1px solid rgba(255,255,255,0.03)',
        }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex' }}><Search size={14} /></span>
          <input
            placeholder="过滤日志..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            style={{
              flex: '1', background: 'transparent', border: 'none', color: 'var(--text-primary)',
              'font-size': '13px', 'font-family': 'inherit', outline: 'none',
            }}
          />
        </div>

        {/* Level filter */}
        <div style={{ padding: '12px 16px', display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
          <For each={[
            { id: 'ALL', label: '全部', count: logs().length },
            { id: 'INFO', label: 'INFO', count: levelCounts().INFO },
            { id: 'WARN', label: 'WARN', count: levelCounts().WARN },
            { id: 'ERROR', label: 'ERROR', count: levelCounts().ERROR },
          ] as const}>
            {(item) => (
              <div
                onClick={() => setLevelFilter(item.id)}
                style={{
                  display: 'flex', 'align-items': 'center', 'justify-content': 'space-between',
                  padding: '8px 12px', 'border-radius': '4px', cursor: 'pointer',
                  'font-size': '12px',
                  background: levelFilter() === item.id ? `rgba(${accentRgb()},0.08)` : 'transparent',
                  color: levelFilter() === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                <span style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                  <span style={{
                    width: '6px', height: '6px', 'border-radius': '50%',
                    background: item.id === 'ALL' ? 'var(--text-muted)' : levelColor(item.id),
                  }} />
                  {item.label}
                </span>
                <span style={{ color: 'var(--text-muted)', 'font-size': '11px' }}>{item.count}</span>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Right: log content */}
      <div style={{ flex: '1', display: 'flex', 'flex-direction': 'column', 'min-width': '0' }}>
        <div style={{
          display: 'flex', 'align-items': 'center', 'justify-content': 'space-between',
          padding: '12px 16px', height: '54px',
          background: 'rgb(var(--top-bar-tint-rgb))',
          'border-bottom': '1px solid rgba(255,255,255,0.03)', 'flex-shrink': '0',
        }}>
          <div style={{ 'font-family': '"Noto Serif SC", serif', 'font-size': '16px', 'font-weight': '600' }}>
            系统日志
          </div>
          <div style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>
            {filtered().length} / {logs().length} 条
          </div>
        </div>
        <div style={{
          flex: '1', 'overflow-y': 'auto', padding: '8px 16px',
          'font-family': '"Cascadia Code", "Fira Code", "Consolas", monospace',
          'font-size': '11px', 'line-height': '1.8',
        }}>
          <Show when={filtered().length > 0} fallback={
            <div style={{ padding: '32px', 'text-align': 'center', color: 'var(--text-muted)', opacity: '0.5', 'font-size': '13px' }}>
              暂无日志匹配
            </div>
          }>
            <For each={filtered()}>
              {(log) => (
                <div style={{ display: 'flex', gap: '10px', padding: '1px 0' }}>
                  <span style={{ color: 'var(--text-muted)', 'white-space': 'nowrap', 'flex-shrink': '0' }}>{log.time.split(' ')[1]}</span>
                  <span style={{ color: levelColor(log.level), 'flex-shrink': '0', width: '42px' }}>[{log.level}]</span>
                  <span style={{ color: 'var(--text-muted)', 'flex-shrink': '0', 'min-width': '70px' }}>[{log.layer}]</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{log.message}</span>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>
    </div>
  )
}
