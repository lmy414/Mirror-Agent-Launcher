import { createSignal, For, Show, onMount } from 'solid-js'
import { Plus, FileText, Settings } from 'lucide-solid'
import { configList, configRead, configWrite, agentAdd, settingsGetAll } from '@/bridge/ipc-client'
import { AgentDetailPanel } from './AgentDetailPanel'
import './AgentConfigPage.css'

interface AgentEntry {
  toolId: string
  displayName: string
  installed: boolean
  askWorkingDir: boolean
}

export function AgentConfigPage() {
  const [agents, setAgents] = createSignal<AgentEntry[]>([])
  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [showAdd, setShowAdd] = createSignal(false)
  const [newName, setNewName] = createSignal('')
  const [newCmd, setNewCmd] = createSignal('')
  const [newDir, setNewDir] = createSignal('')

  onMount(async () => {
    const list = await configList()
    const allSettings = await settingsGetAll()
    setAgents(list.map((a) => ({
      toolId: a.toolId,
      displayName: a.displayName,
      installed: a.installed,
      askWorkingDir: allSettings[`agent:${a.toolId}:askWorkingDir`] === 'true',
    })))
    // 默认选中第一个
    if (list.length > 0) {
      setSelectedId(list[0].toolId)
    }
  })

  const selected = () => agents().find((a) => a.toolId === selectedId())

  const installed = () => agents().filter((a) => a.installed)
  const adapted = () => agents()

  const handleAddAgent = async () => {
    if (!newName()) return
    const toolId = 'agent-' + Date.now()
    await agentAdd(toolId, newName())
    if (newCmd() || newDir()) {
      await configWrite(toolId, { command: newCmd() || newName(), cwd: newDir() || '' })
    }
    const list = await configList()
    const allSettings = await settingsGetAll()
    setAgents(list.map((a) => ({
      toolId: a.toolId,
      displayName: a.displayName,
      installed: a.installed,
      askWorkingDir: allSettings[`agent:${a.toolId}:askWorkingDir`] === 'true',
    })))
    setNewName(''); setNewCmd(''); setNewDir(''); setShowAdd(false)
    setSelectedId(toolId)
  }

  return (
    <div class="agent-page">
      {/* ── 左侧：CLI 工具列表 ── */}
      <div class="agent-page__sidebar">
        {/* 已安装 */}
        <div class="agent-page__sidebar-section agent-page__sidebar-section--installed">
          <div class="agent-page__sidebar-header">
            <span>已安装的 CLI 工具</span>
            <span class="agent-page__sidebar-count">{installed().length}</span>
          </div>
          <div class="agent-page__sidebar-list">
            <For each={installed()} fallback={
              <div style={{ padding: '12px', 'font-size': '11px', color: 'var(--text-muted)', opacity: '0.5', 'text-align': 'center' }}>
                未检测到已安装的工具
              </div>
            }>
              {(agent) => (
                <div
                  class="agent-page__sidebar-item"
                  classList={{ 'agent-page__sidebar-item--selected': selectedId() === agent.toolId }}
                  onClick={() => setSelectedId(agent.toolId)}
                >
                  <span class="agent-page__sidebar-item-dot agent-page__sidebar-item-dot--installed" />
                  <span class="agent-page__sidebar-item-name">{agent.displayName}</span>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* 已适配 */}
        <div class="agent-page__sidebar-section agent-page__sidebar-section--adapted">
          <div class="agent-page__sidebar-header">
            <span>已适配的 CLI 工具</span>
            <span class="agent-page__sidebar-count">{adapted().length}</span>
          </div>
          <div class="agent-page__sidebar-list">
            <For each={adapted()}>
              {(agent) => (
                <div
                  class="agent-page__sidebar-item"
                  classList={{ 'agent-page__sidebar-item--selected': selectedId() === agent.toolId }}
                  onClick={() => setSelectedId(agent.toolId)}
                >
                  <span
                    class="agent-page__sidebar-item-dot"
                    classList={{
                      'agent-page__sidebar-item-dot--installed': agent.installed,
                      'agent-page__sidebar-item-dot--not-installed': !agent.installed,
                    }}
                  />
                  <span class="agent-page__sidebar-item-name">{agent.displayName}</span>
                  {!agent.installed && <span class="agent-page__sidebar-item-tag">未安装</span>}
                </div>
              )}
            </For>
          </div>
        </div>

        {/* 添加自定义工具 */}
        <button class="agent-page__add-btn" onClick={() => setShowAdd(!showAdd())}>
          <Plus size={14} />
          添加 CLI 工具
        </button>

        <Show when={showAdd()}>
          <div class="agent-page__add-form">
            <input class="agent-detail__input" placeholder="工具名称" value={newName()} onInput={(e) => setNewName(e.currentTarget.value)} />
            <input class="agent-detail__input" placeholder="启动命令（如 codewhale）" value={newCmd()} onInput={(e) => setNewCmd(e.currentTarget.value)} />
            <input class="agent-detail__input" placeholder="工作目录" value={newDir()} onInput={(e) => setNewDir(e.currentTarget.value)} />
            <div style={{ display: 'flex', gap: '8px', 'justify-content': 'flex-end' }}>
              <button class="agent-detail__view-config" onClick={() => setShowAdd(false)}>取消</button>
              <button class="agent-detail__save-btn" onClick={handleAddAgent}>添加</button>
            </div>
          </div>
        </Show>
      </div>

      {/* ── 右侧：详情面板 ── */}
      <div class="agent-page__detail">
        <Show when={selected()} fallback={
          <div class="agent-page__detail-empty">
            <Settings size={32} />
            <span>从左侧选择一个 CLI 工具</span>
          </div>
        }>
          <AgentDetailPanel
            toolId={selected()!.toolId}
            displayName={selected()!.displayName}
            installed={selected()!.installed}
          />
        </Show>
      </div>
    </div>
  )
}
