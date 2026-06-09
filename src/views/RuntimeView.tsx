import { createSignal, For, Show, onMount, onCleanup } from 'solid-js'
import { Clock, Activity, Zap } from 'lucide-solid'
import { onRuntimeUpdate, type RuntimeRecord } from '@/bridge/ipc-client'
import { formatDuration, formatTokens } from '@/shell/format'

export default function RuntimeView() {
  const [records, setRecords] = createSignal<RuntimeRecord[]>([])
  const [now, setNow] = createSignal(Date.now())

  let timer: ReturnType<typeof setInterval> | undefined

  onMount(() => {
    const unsub = onRuntimeUpdate((list) => {
      setRecords(list)
    })
    // 每秒刷新时长
    timer = setInterval(() => setNow(Date.now()), 1000)
    onCleanup(() => {
      unsub()
      if (timer) clearInterval(timer)
    })
  })

  const runningCount = () => records().filter((r) => !r.endedAt).length

  return (
    <div class="glass-panel-full" style={{ display: 'flex', 'flex-direction': 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', 'align-items': 'center', gap: '8px',
        padding: '12px 16px', height: '54px',
        background: 'rgb(var(--top-bar-tint-rgb))',
        'border-bottom': '1px solid rgba(255,255,255,0.03)',
        'flex-shrink': '0',
      }}>
        <Activity size={16} style={{ color: 'var(--accent)' }} />
        <span style={{ 'font-family': '"Noto Serif SC", serif', 'font-size': '14px', 'font-weight': '600' }}>运行记录</span>
        <span style={{ 'margin-left': 'auto', 'font-size': '11px', color: 'var(--text-muted)' }}>
          {runningCount()} 运行中
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: '1', overflow: 'auto', padding: '16px' }}>
        <Show
          when={records().length > 0}
          fallback={
            <div style={{
              display: 'flex', 'flex-direction': 'column', 'align-items': 'center',
              'justify-content': 'center', height: '100%', gap: '12px',
              color: 'var(--text-muted)', opacity: '0.5',
            }}>
              <Activity size={48} />
              <div style={{ 'font-size': '13px' }}>暂无运行记录</div>
              <div style={{ 'font-size': '11px' }}>启动终端后将在此显示运行状态</div>
            </div>
          }
        >
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
            <For each={records()}>
              {(record) => {
                const isRunning = () => !record.endedAt
                const duration = () =>
                  record.endedAt
                    ? record.endedAt - record.startedAt
                    : now() - record.startedAt

                return (
                  <div style={{
                    display: 'flex', 'align-items': 'center', gap: '14px',
                    padding: '14px 18px',
                    background: 'var(--card-bg)',
                    border: `1px solid ${isRunning() ? 'rgba(var(--accent-rgb), 0.15)' : 'rgba(255,255,255,0.04)'}`,
                    'border-radius': '8px',
                  }}>
                    {/* 状态指示 */}
                    <div style={{
                      width: '8px', height: '8px', 'border-radius': '50%', 'flex-shrink': '0',
                      background: isRunning() ? 'var(--success)' : 'var(--text-muted)',
                    }} />

                    {/* 名称 + 时长 */}
                    <div style={{ 'min-width': '140px' }}>
                      <div style={{ 'font-size': '14px', 'font-weight': '500' }}>{record.displayName}</div>
                      <div style={{ 'font-size': '11px', color: 'var(--text-muted)', display: 'flex', 'align-items': 'center', gap: '4px', 'margin-top': '2px' }}>
                        <Clock size={11} />
                        {formatDuration(duration())}
                        {isRunning() && (
                          <span style={{ color: 'var(--success)', 'font-size': '10px' }}>● 运行中</span>
                        )}
                        {!isRunning() && record.exitCode !== undefined && (
                          <span style={{ color: record.exitCode === 0 ? 'var(--text-muted)' : 'var(--error)' }}>
                            {record.exitCode === 0 ? '正常退出' : `退出码 ${record.exitCode}`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Token */}
                    <div style={{
                      display: 'flex', 'align-items': 'center', gap: '6px',
                      'margin-left': 'auto',
                      'font-family': '"JetBrains Mono", monospace',
                      'font-size': '12px', color: 'var(--text-secondary)',
                    }}>
                      <Show when={record.tokensIn > 0 || record.tokensOut > 0}>
                        <Zap size={12} style={{ color: 'var(--accent)' }} />
                        <span title="输入 tokens">{formatTokens(record.tokensIn)}</span>
                        <span style={{ color: 'var(--text-muted)' }}>/</span>
                        <span title="输出 tokens">{formatTokens(record.tokensOut)}</span>
                        <span style={{ 'font-size': '10px', color: 'var(--text-muted)' }}>tokens</span>
                      </Show>
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </Show>
      </div>
    </div>
  )
}
