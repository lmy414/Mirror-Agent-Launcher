import { createSignal, onMount, onCleanup } from 'solid-js'
import { X } from 'lucide-solid'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { terminalStdin, terminalResize, onTerminalStdout, onTerminalExit } from '@/bridge/ipc-client'
import { accentHex } from '@/shell/theme'
import { setTerminalRunning, type TerminalSessionInfo } from '@/shell/app-state'

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

// ── stdout 全局缓冲（解决竞态：PTY 先产数据，组件后挂载）──
const stdoutBuffer = new Map<string, string[]>()
let globalUnsub: (() => void) | null = null

// 模块加载时立即注册全局监听（比任何组件 onMount 都早）
if (typeof window !== 'undefined' && window.electronAPI) {
  globalUnsub = onTerminalStdout(({ sessionId, data }) => {
    let buf = stdoutBuffer.get(sessionId)
    if (!buf) {
      buf = []
      stdoutBuffer.set(sessionId, buf)
    }
    buf.push(data)
  })
}

/** 为指定 session 设置直接管道（替换全局缓冲），返回已缓冲数据 */
function setupPerSession(sessionId: string, writeFn: (data: string) => void): string {
  // 全局监听器在模块加载时已注册，此处无需再注册
  const oldBuf = stdoutBuffer.get(sessionId) ?? []
  const pending = oldBuf.join('')
  // 原子替换：后续 push 直接写入 xterm
  const live: string[] = []
  Object.defineProperty(live, 'push', { value: (chunk: string) => { writeFn(chunk); return 1 } })
  stdoutBuffer.set(sessionId, live)
  return pending
}

/** 清理 per-session 状态 */
function teardownPerSession(sessionId: string) {
  stdoutBuffer.delete(sessionId)
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

    // ── 粘贴支持：捕获 Ctrl+V / Ctrl+Shift+V ──
    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        // 先尝试 Electron clipboard，再降级到 navigator
        try {
          if (window.electronAPI?.clipboard?.readText) {
            const text = window.electronAPI.clipboard.readText()
            if (text && term) { terminalStdin(props.session.id, text) }
            return false
          }
        } catch { /* fall through */ }
        navigator.clipboard.readText().then((text) => {
          if (text && term) { terminalStdin(props.session.id, text) }
        }).catch(() => {/* denied */})
        return false
      }
      return true
    })

    // ── 重放缓冲数据 + 建立直接管道 ──
    const writeToTerm = (data: string) => {
      if (term) term.write(data)
    }
    const pending = setupPerSession(props.session.id, writeToTerm)
    // 回放组件挂载前已缓冲的输出
    if (pending) {
      term.write(pending)
    }

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
      unsubExit()
      teardownPerSession(props.session.id)
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

      {/* xterm container — 必须覆盖全局 user-select: none */}
      <div
        ref={containerRef}
        style={{
          flex: '1',
          'min-height': '0',
          background: 'rgba(0,0,0,0.35)',
          'user-select': 'text',
          '-webkit-user-select': 'text',
        }}
      />
    </div>
  )
}
