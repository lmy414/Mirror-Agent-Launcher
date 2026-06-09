import { For, Show, createMemo } from 'solid-js'
import { Terminal as TerminalIcon } from 'lucide-solid'
import { registry } from '@/registry'
import { getTerminalSessions, removeTerminalSession, type TerminalSessionInfo } from '@/shell/app-state'
import { TerminalWindow } from '@/extensions/terminal-view/TerminalView'
import { agentStop } from '@/bridge/ipc-client'

export default function PencilMainView() {
  const sidebarExts = () => registry.getBySlot('sidebar')

  const renderSidebarExt = (id: string) => {
    const ext = sidebarExts().find((e) => e.id === id)
    if (!ext) return null
    const Comp = ext.component
    return <Comp />
  }

  const sessions = (): TerminalSessionInfo[] => getTerminalSessions()()

  // 动态网格：1=全屏, 2=上半各半, 3=上半各1/3, 4+=auto-fill
  const gridStyle = createMemo(() => {
    const n = sessions().length
    if (n === 1) {
      return {
        'grid-template-columns': '1fr',
        'grid-template-rows': '1fr',
      }
    }
    if (n === 2) {
      return {
        'grid-template-columns': '1fr 1fr',
        'grid-template-rows': '1fr 1fr',
      }
    }
    if (n === 3) {
      return {
        'grid-template-columns': '1fr 1fr 1fr',
        'grid-template-rows': '1fr 1fr',
      }
    }
    // 4+ auto-fill
    return {
      'grid-template-columns': 'repeat(auto-fill, minmax(450px, 1fr))',
      'grid-auto-rows': 'minmax(250px, 1fr)',
    }
  })

  const handleClose = (session: TerminalSessionInfo) => {
    agentStop(session.id)
    removeTerminalSession(session.id)
  }

  return (
    <>
      {renderSidebarExt('sidebar')}
      <div style={{ flex: '1', 'min-width': '0', display: 'flex', 'flex-direction': 'column' }}>
        {/* 标题栏 */}
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
            padding: '12px 16px',
            height: '54px',
            background: 'rgb(var(--top-bar-tint-rgb))',
            'border-bottom': '1px solid rgba(255,255,255,0.03)',
            'flex-shrink': '0',
          }}
        >
          <TerminalIcon size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ 'font-family': '"Noto Serif SC", serif', 'font-size': '14px', 'font-weight': '600' }}>终端</span>
          <Show when={sessions().length > 0}>
            <span style={{ 'margin-left': 'auto', 'font-size': '11px', color: 'var(--text-muted)' }}>
              {sessions().filter((s) => s.running).length}/{sessions().length} 运行中
            </span>
          </Show>
        </div>

        {/* 终端网格 — 按数量动态布局 */}
        <div
          style={{
            flex: '1',
            'min-height': '0',
            display: 'grid',
            gap: '8px',
            padding: '8px',
            overflow: 'auto',
            ...gridStyle(),
          }}
        >
          <Show
            when={sessions().length > 0}
            fallback={
              <div
                style={{
                  'grid-column': '1 / -1',
                  display: 'flex',
                  'flex-direction': 'column',
                  'align-items': 'center',
                  'justify-content': 'center',
                  gap: '12px',
                  color: 'var(--text-muted)',
                  opacity: '0.5',
                }}
              >
                <TerminalIcon size={48} />
                <div style={{ 'font-size': '13px' }}>在左侧 Agent 中点「新建终端」启动</div>
              </div>
            }
          >
            <For each={sessions()}>
              {(session) => (
                <TerminalWindow
                  session={session}
                  onClose={() => handleClose(session)}
                />
              )}
            </For>
          </Show>
        </div>
      </div>
    </>
  )
}
