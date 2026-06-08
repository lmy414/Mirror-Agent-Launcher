import { createSignal, onMount, onCleanup } from 'solid-js'
import { X } from 'lucide-solid'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { terminalStdin, terminalResize, onTerminalStdout, onTerminalExit } from '@/bridge/ipc-client'
import { accentHex } from '@/shell/theme'

// ── 终端主题（继承玻璃拟态色系）──
function createTerminalTheme(): object {
  return {
    background: 'rgba(0, 0, 0, 0.50)',
    foreground: '#d0d0d8',
    cursor: accentHex(),
    cursorAccent: '#000000',
    selectionBackground: 'rgba(107, 143, 168, 0.30)',
    fontSize: 13,
    fontFamily: '"JetBrains Mono", "Cascadia Code", "Fira Code", monospace',
    allowTransparency: true,
  }
}

// ── 全局终端会话 store ──
export interface TerminalSessionInfo {
  id: string
  title: string
  toolId: string
  running: boolean
  exitCode?: number
}

const [sessions, setSessions] = createSignal<TerminalSessionInfo[]>([])

export function getTerminalSessions() {
  return sessions
}

export function addTerminalSession(toolId: string, title: string): string {
  const id = `term-${toolId}-${Date.now()}`
  setSessions((prev) => [...prev, { id, title, toolId, running: true }])
  return id
}

export function removeTerminalSession(id: string) {
  setSessions((prev) => prev.filter((s) => s.id !== id))
}

export function setTerminalRunning(id: string, running: boolean) {
  setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, running } : s)))
}

// ── 单个终端窗口组件 ──
export function TerminalWindow(props: {
  session: TerminalSessionInfo
  onClose: () => void
}) {
  let containerRef: HTMLDivElement | undefined
  let term: Terminal | undefined
  const [fitAddon, setFitAddon] = createSignal<any>(null)

  onMount(async () => {
    if (!containerRef) return

    // lazy load fit addon
    const { FitAddon } = await import('@xterm/addon-fit')
    const fit = new FitAddon()

    term = new Terminal({
      ...createTerminalTheme(),
      cols: 120,
      rows: 40,
    })

    term.loadAddon(fit)
    term.open(containerRef)
    fit.fit()
    setFitAddon(fit)

    // ── 输入 → IPC → PTY ──
    term.onData((data: string) => {
      terminalStdin(props.session.id, data)
    })

    // ── PTY stdout → xterm ──
    const unsubStdout = onTerminalStdout(({ sessionId, data }) => {
      if (sessionId === props.session.id && term) {
        term.write(data)
      }
    })

    // ── PTY exit ──
    const unsubExit = onTerminalExit(({ sessionId, exitCode }) => {
      if (sessionId === props.session.id) {
        setTerminalRunning(props.session.id, false)
        if (term) {
          term.write(`\r\n[进程退出 code=${exitCode}]\r\n`)
        }
      }
    })

    // ── resize 事件 ──
    const resizeObserver = new ResizeObserver(() => {
      if (term && fitAddon()) {
        fitAddon().fit()
        terminalResize(props.session.id, term.cols, term.rows)
      }
    })
    resizeObserver.observe(containerRef)

    onCleanup(() => {
      unsubStdout()
      unsubExit()
      resizeObserver.disconnect()
      term?.dispose()
    })
  })

  return (
    <div
      class="glass-panel"
      style={{
        display: 'flex',
        'flex-direction': 'column',
        'border-radius': 'var(--radius-md)',
        border: '1px solid var(--glass-border)',
        overflow: 'hidden',
        'user-select': 'text',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '8px',
          padding: '6px 12px',
          'border-bottom': '1px solid rgba(255,255,255,0.06)',
          'flex-shrink': '0',
          'user-select': 'none',
          'font-size': '12px',
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            'border-radius': '50%',
            background: props.session.running ? 'var(--success)' : 'var(--text-muted)',
          }}
        />
        <span style={{ 'font-weight': '500' }}>{props.session.title}</span>
        <span
          style={{
            'margin-left': 'auto',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
          }}
          onClick={props.onClose}
        >
          <X size={14} />
        </span>
      </div>

      {/* xterm container */}
      <div
        ref={containerRef}
        style={{
          flex: '1',
          'min-height': '0',
          background: 'rgba(0,0,0,0.35)',
        }}
      />
    </div>
  )
}
