import { createSignal, For, Show, onMount } from 'solid-js'
import { FolderOpen, Plus, X } from 'lucide-solid'
import { dialogOpenDirectory, settingsGetAll, settingsSet } from '@/bridge/ipc-client'

export function WorkingDirSection() {
  const [dirs, setDirs] = createSignal<string[]>([])
  const [editingIdx, setEditingIdx] = createSignal<number | null>(null)
  const [editValue, setEditValue] = createSignal('')

  onMount(async () => {
    const all = await settingsGetAll()
    const raw = all['working-dirs']
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setDirs(parsed)
      } catch { /* ignore */ }
    }
  })

  const save = async (next: string[]) => {
    setDirs(next)
    await settingsSet('working-dirs', JSON.stringify(next))
  }

  const handleAdd = async () => {
    const path = await dialogOpenDirectory()
    if (path && !dirs().includes(path)) {
      await save([...dirs(), path])
    }
  }

  const handleRemove = async (path: string) => {
    await save(dirs().filter((d) => d !== path))
  }

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditValue(dirs()[idx])
  }

  const commitEdit = async () => {
    const idx = editingIdx()
    if (idx === null) return
    const next = [...dirs()]
    next[idx] = editValue()
    await save(next)
    setEditingIdx(null)
  }

  const titleStyle = { 'font-family': '"Noto Serif SC", serif', 'font-size': '15px', 'font-weight': '600', color: 'var(--text-primary)' }
  const cardStyle = { background: '#0E0E1640', border: '1px solid rgba(255,255,255,0.024)', 'border-radius': '6px' }

  return (
    <>
      <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)', opacity: '0.35', 'margin-bottom': '20px' }} />

      <div style={{ ...titleStyle, 'margin-bottom': '12px' }}>工作目录</div>
      <div style={{ 'font-size': '12px', color: 'var(--text-muted)', 'margin-bottom': '12px' }}>
        配置常用工作目录，新建终端时可快速选择
      </div>

      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px', ...cardStyle, padding: '8px' }}>
        {/* 列表 */}
        <For each={dirs()} fallback={
          <div style={{ padding: '14px', 'text-align': 'center', 'font-size': '12px', color: 'var(--text-muted)', opacity: '0.6' }}>
            暂无目录，点击下方按钮添加
          </div>
        }>
          {(dir, idx) => (
            <div style={{
              display: 'flex', 'align-items': 'center', gap: '10px',
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              'border-radius': '6px',
            }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', 'flex-shrink': '0' }}>
                <FolderOpen size={14} />
              </span>

              <Show when={editingIdx() === idx()} fallback={
                <span
                  style={{
                    flex: '1', color: 'var(--text-secondary)',
                    'font-family': '"JetBrains Mono", "Consolas", monospace',
                    'font-size': '11px', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap',
                    cursor: 'pointer',
                  }}
                  onClick={() => startEdit(idx())}
                  title="点击编辑"
                >
                  {dir}
                </span>
              }>
                <input
                  value={editValue()}
                  onInput={(e) => setEditValue(e.currentTarget.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                  style={{
                    flex: '1',
                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', 'border-radius': '4px',
                    padding: '4px 8px', color: 'var(--text-primary)', 'font-size': '11px',
                    'font-family': '"JetBrains Mono", "Consolas", monospace', outline: 'none',
                  }}
                  autofocus
                />
              </Show>

              <span
                onClick={() => handleRemove(dir)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', 'flex-shrink': '0', padding: '2px' }}
              >
                <X size={14} />
              </span>
            </div>
          )}
        </For>

        {/* 添加按钮 */}
        <button
          onClick={handleAdd}
          style={{
            display: 'flex', 'align-items': 'center', 'justify-content': 'center', gap: '8px',
            padding: '10px', 'border-radius': '6px',
            background: 'transparent', border: '1px dashed rgba(255,255,255,0.08)',
            color: 'var(--text-muted)', cursor: 'pointer',
            'font-size': '12px', 'font-family': 'inherit',
          }}
        >
          <Plus size={14} />
          添加工作目录
        </button>
      </div>
    </>
  )
}
