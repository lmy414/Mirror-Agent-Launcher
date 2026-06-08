import { createSignal, For, Show, onMount } from 'solid-js'
import { configList, agentAdd, configWrite } from '@/bridge/ipc-client'

export function AgentConfigPage() {
  const [agents, setAgents] = createSignal<{ id: string; name: string; command: string; dir: string; status: string }[]>([])
  const [editId, setEditId] = createSignal<string | null>(null)
  const [showAdd, setShowAdd] = createSignal(false)
  const [newName, setNewName] = createSignal('')
  const [newCmd, setNewCmd] = createSignal('')
  const [newDir, setNewDir] = createSignal('')

  onMount(async () => {
    const list = await configList()
    setAgents(list.map((a) => ({
      id: a.toolId,
      name: a.displayName,
      command: '',
      dir: '',
      status: a.installed ? 'running' : 'stopped',
    })))
  })

  return (
    <>
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
        <button onClick={() => setShowAdd(!showAdd())}
          style={{ padding: '8px 14px', 'border-radius': '6px', cursor: 'pointer', background: 'rgba(var(--accent-rgb), 0.1)', border: '1px dashed rgba(var(--accent-rgb), 0.3)', color: 'var(--accent)', 'font-size': '12px', 'font-family': 'inherit', display: 'flex', 'align-items': 'center', gap: '6px', 'justify-content': 'center' }}>
          + 添加 Agent
        </button>
        <Show when={showAdd()}>
          <div style={{ padding: '12px', background: 'var(--card-bg)', 'border-radius': '8px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
            <input placeholder="名称" value={newName()} onInput={(e) => setNewName(e.currentTarget.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', 'border-radius': '4px', padding: '8px 12px', color: 'var(--text-primary)', 'font-size': '13px', 'font-family': 'inherit', outline: 'none' }} />
            <input placeholder="启动命令" value={newCmd()} onInput={(e) => setNewCmd(e.currentTarget.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', 'border-radius': '4px', padding: '8px 12px', color: 'var(--text-primary)', 'font-size': '13px', 'font-family': '"JetBrains Mono", monospace', outline: 'none' }} />
            <input placeholder="工作目录" value={newDir()} onInput={(e) => setNewDir(e.currentTarget.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', 'border-radius': '4px', padding: '8px 12px', color: 'var(--text-primary)', 'font-size': '13px', 'font-family': '"JetBrains Mono", monospace', outline: 'none' }} />
            <div style={{ display: 'flex', gap: '8px', 'justify-content': 'flex-end' }}>
              <button onClick={() => setShowAdd(false)} style={{ padding: '6px 12px', 'border-radius': '4px', cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', 'font-size': '12px', 'font-family': 'inherit' }}>取消</button>
              <button onClick={async () => {
                if (!newName()) return
                const toolId = 'agent-' + Date.now()
                await agentAdd(toolId, newName())
                if (newCmd() || newDir()) {
                  await configWrite(toolId, { command: newCmd() || newName(), cwd: newDir() || '' })
                }
                setAgents((prev) => [...prev, { id: toolId, name: newName(), command: newCmd() || newName(), dir: newDir() || '', status: 'stopped' }])
                setNewName(''); setNewCmd(''); setNewDir(''); setShowAdd(false)
              }} style={{ padding: '6px 12px', 'border-radius': '4px', cursor: 'pointer', background: 'rgba(var(--accent-rgb), 0.2)', border: 'none', color: 'var(--accent)', 'font-size': '12px', 'font-family': 'inherit' }}>添加</button>
            </div>
          </div>
        </Show>
        <For each={agents()}>
          {(agent) => (
            <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.04)', 'border-radius': '8px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', 'align-items': 'center', gap: '10px', padding: '12px 16px', cursor: 'pointer', background: editId() === agent.id ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                onClick={() => setEditId(editId() === agent.id ? null : agent.id)}>
                <div style={{ width: '8px', height: '8px', 'border-radius': '50%', background: agent.status === 'running' ? 'var(--success)' : 'var(--text-muted)' }} />
                <div style={{ flex: '1' }}>
                  <div style={{ 'font-size': '14px', 'font-weight': '500' }}>{agent.name}</div>
                  <div style={{ 'font-size': '10px', color: 'var(--text-muted)', 'font-family': '"JetBrains Mono", monospace' }}>{agent.command}</div>
                </div>
                <span style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>{agent.status}</span>
              </div>
              <Show when={editId() === agent.id}>
                <div style={{ padding: '12px 16px', 'border-top': '1px solid rgba(255,255,255,0.04)', display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                  <div><div style={{ 'font-size': '10px', color: 'var(--text-muted)', 'margin-bottom': '2px' }}>名称</div>
                    <input value={agent.name} onInput={(e) => setAgents((prev) => prev.map((a) => a.id === agent.id ? { ...a, name: e.currentTarget.value } : a))}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', 'border-radius': '4px', padding: '6px 10px', color: 'var(--text-primary)', 'font-size': '12px', 'font-family': 'inherit', outline: 'none' }} /></div>
                  <div><div style={{ 'font-size': '10px', color: 'var(--text-muted)', 'margin-bottom': '2px' }}>启动命令</div>
                    <input value={agent.command} onInput={(e) => setAgents((prev) => prev.map((a) => a.id === agent.id ? { ...a, command: e.currentTarget.value } : a))}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', 'border-radius': '4px', padding: '6px 10px', color: 'var(--text-primary)', 'font-size': '12px', 'font-family': '"JetBrains Mono", monospace', outline: 'none' }} /></div>
                  <div><div style={{ 'font-size': '10px', color: 'var(--text-muted)', 'margin-bottom': '2px' }}>工作目录</div>
                    <input value={agent.dir} onInput={(e) => setAgents((prev) => prev.map((a) => a.id === agent.id ? { ...a, dir: e.currentTarget.value } : a))}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', 'border-radius': '4px', padding: '6px 10px', color: 'var(--text-primary)', 'font-size': '12px', 'font-family': '"JetBrains Mono", monospace', outline: 'none' }} /></div>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
    </>
  )
}
