import { createSignal, For, Show, createMemo } from 'solid-js'
import { useAgent } from '@/shell/useAgent'
import { SectionTitle, Btn, ToggleButton } from './shared'
import { Globe, FolderOpen } from 'lucide-solid'

export function SkillsPage() {
  const agent = useAgent()
  const [showInstall, setShowInstall] = createSignal(false)
  const [installTarget, setInstallTarget] = createSignal<'user' | 'project'>('project')
  const [zipPath, setZipPath] = createSignal('')

  const userSkills = createMemo(() => agent.skills().filter((s) => s.source === 'user'))
  const projectSkills = createMemo(() => agent.skills().filter((s) => s.source === 'project'))

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement
    if (input.files && input.files[0]) {
      setZipPath((input.files[0] as any).path ?? input.files[0].name)
    }
  }

  const handleInstall = () => {
    if (!zipPath()) return
    agent.installSkill(zipPath(), installTarget())
    setShowInstall(false)
    setZipPath('')
  }

  return (
    <>
      <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', 'margin-bottom': '16px' }}>
        <SectionTitle>已安装技能</SectionTitle>
        <Btn onClick={() => setShowInstall(true)}>+ 安装技能</Btn>
      </div>

      <Show when={showInstall()}>
        <div style={{ padding: '14px', background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.06)', 'border-radius': '6px', 'margin-bottom': '16px' }}>
          <div style={{ 'font-size': '12px', 'margin-bottom': '10px', color: 'var(--text-secondary)' }}>选择安装位置与技能包（.zip）</div>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '10px', 'margin-bottom': '10px' }}>
            <select value={installTarget()} onChange={(e) => setInstallTarget(e.currentTarget.value as 'user' | 'project')}
              style={{ padding: '5px 8px', 'font-size': '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', 'border-radius': '4px', color: 'var(--text-primary)' }}>
              <option value="project">项目级（.pi/skills）</option>
              <option value="user">全局（~/.pi/agent/skills）</option>
            </select>
            <span style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>{installTarget() === 'project' ? agent.skillDirs().project : agent.skillDirs().user}</span>
          </div>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
            <input type="file" accept=".zip" onChange={handleFileSelect} style={{ 'font-size': '12px', color: 'var(--text-secondary)' }} />
            <Btn primary onClick={handleInstall}>安装</Btn>
            <Btn onClick={() => setShowInstall(false)}>取消</Btn>
          </div>
        </div>
      </Show>

      {/* 全局技能 */}
      <div style={{ 'margin-bottom': '16px' }}>
        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px', 'margin-bottom': '10px' }}>
          <Globe size={14} />
          <span style={{ 'font-size': '12px', 'font-weight': '500' }}>全局技能</span>
          <span style={{ 'font-size': '11px', color: 'var(--text-muted)', 'margin-left': 'auto' }}>所有项目可用</span>
        </div>
        <Show when={userSkills().length > 0}>
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
            <For each={userSkills()}>
              {(skill) => (
                <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', padding: '10px 14px', background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.03)', 'border-radius': '4px' }}>
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: '2px' }}>
                    <div style={{ 'font-size': '12px' }}>{skill.name}</div>
                    <div style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>{skill.description}</div>
                  </div>
                  <div style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
                    <ToggleButton enabled={skill.enabled} onToggle={() => agent.toggleSkill(skill.name, 'user', !skill.enabled)} />
                    <span onClick={() => agent.removeSkill(skill.name, 'user', skill.dirName)} style={{ color: 'var(--text-muted)', cursor: 'pointer', 'font-size': '11px' }}>删除</span>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
        <Show when={userSkills().length === 0}>
          <div style={{ 'font-size': '12px', color: 'var(--text-muted)', padding: '12px 0' }}>暂无全局技能</div>
        </Show>
      </div>

      {/* 项目技能 */}
      <div style={{ 'margin-bottom': '16px' }}>
        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px', 'margin-bottom': '10px' }}>
          <FolderOpen size={14} />
          <span style={{ 'font-size': '12px', 'font-weight': '500' }}>项目技能</span>
          <span style={{ 'font-size': '11px', color: 'var(--text-muted)', 'margin-left': 'auto' }}>仅当前项目可用</span>
        </div>
        <Show when={projectSkills().length > 0}>
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
            <For each={projectSkills()}>
              {(skill) => (
                <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', padding: '10px 14px', background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.03)', 'border-radius': '4px' }}>
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: '2px' }}>
                    <div style={{ 'font-size': '12px' }}>{skill.name}</div>
                    <div style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>{skill.description}</div>
                  </div>
                  <div style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
                    <ToggleButton enabled={skill.enabled} onToggle={() => agent.toggleSkill(skill.name, 'project', !skill.enabled)} />
                    <span onClick={() => agent.removeSkill(skill.name, 'project', skill.dirName)} style={{ color: 'var(--text-muted)', cursor: 'pointer', 'font-size': '11px' }}>删除</span>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
        <Show when={projectSkills().length === 0}>
          <div style={{ 'font-size': '12px', color: 'var(--text-muted)', padding: '12px 0' }}>暂无项目技能</div>
        </Show>
      </div>

      <McpSection />
    </>
  )
}

// ── MCP 管理 ──

function McpSection() {
  const agent = useAgent()
  const [showAdd, setShowAdd] = createSignal(false)
  const [jsonInput, setJsonInput] = createSignal('')
  const [expandedId, setExpandedId] = createSignal<string | null>(null)
  const [jsonError, setJsonError] = createSignal('')

  const EXAMPLE_JSON = `{
  "id": "filesystem",
  "name": "文件系统",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"],
  "tools": [{ "name": "read_file", "description": "读取文件内容", "params": { "path": { "type": "string", "required": true, "description": "文件路径" } } }],
  "enabled": true
}`

  const handleSave = () => {
    setJsonError('')
    try {
      const cfg = JSON.parse(jsonInput())
      if (!cfg.id || !cfg.name || !cfg.command || !Array.isArray(cfg.args) || !Array.isArray(cfg.tools)) {
        setJsonError('缺少必要字段：id, name, command, args, tools')
        return
      }
      agent.saveMcp(cfg as import('@bridge/protocol').MCPServerConfig)
      setShowAdd(false)
      setJsonInput('')
    } catch {
      setJsonError('JSON 格式错误')
    }
  }

  return (
    <>
      <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', 'margin-bottom': '16px', 'margin-top': '24px' }}>
        <SectionTitle>MCP 工具管理</SectionTitle>
        <Btn primary onClick={() => { setShowAdd(true); setJsonInput(EXAMPLE_JSON) }}>+ 添加 MCP</Btn>
      </div>

      <Show when={showAdd()}>
        <div style={{ padding: '14px', background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.06)', 'border-radius': '6px', 'margin-bottom': '16px' }}>
          <div style={{ 'font-size': '12px', 'margin-bottom': '8px', color: 'var(--text-secondary)' }}>输入 MCP Server JSON 配置（参考示例）</div>
          <textarea value={jsonInput()} onInput={(e) => setJsonInput(e.currentTarget.value)}
            style={{ width: '100%', height: '180px', padding: '10px', 'font-size': '12px', 'font-family': '"JetBrains Mono", monospace', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', 'border-radius': '4px', color: 'var(--text-primary)', resize: 'vertical', 'box-sizing': 'border-box' as const }} />
          <Show when={jsonError()}>
            <div style={{ 'font-size': '11px', color: 'var(--error)', 'margin-top': '6px' }}>{jsonError()}</div>
          </Show>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '10px', 'margin-top': '10px' }}>
            <Btn primary onClick={handleSave}>保存</Btn>
            <Btn onClick={() => { setShowAdd(false); setJsonError('') }}>取消</Btn>
          </div>
        </div>
      </Show>

      <Show when={agent.mcpServers().length === 0 && !showAdd()}>
        <div style={{ 'font-size': '12px', color: 'var(--text-muted)', padding: '20px', 'text-align': 'center' }}>暂无 MCP 配置，点击右上角添加</div>
      </Show>

      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
        <For each={agent.mcpServers()}>
          {(server) => {
            const isExpanded = createMemo(() => expandedId() === server.id)
            return (
              <div style={{ padding: '10px 14px', background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.03)', 'border-radius': '4px' }}>
                <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' }}>
                  <div style={{ display: 'flex', 'align-items': 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded() ? null : server.id)}>
                    <span style={{ color: 'var(--text-muted)', 'font-size': '11px' }}>{isExpanded() ? '▼' : '▶'}</span>
                    <div>
                      <div style={{ 'font-size': '12px' }}>{server.name}</div>
                      <div style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>{server.command} {server.args.join(' ')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
                    <ToggleButton enabled={server.enabled} onToggle={() => agent.toggleMcp(server.id, !server.enabled)} />
                    <span onClick={() => agent.removeMcp(server.id)} style={{ color: 'var(--text-muted)', cursor: 'pointer', 'font-size': '11px' }}>删除</span>
                  </div>
                </div>
                <Show when={isExpanded()}>
                  <div style={{ 'margin-top': '10px', 'padding-top': '10px', 'border-top': '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ 'font-size': '11px', color: 'var(--text-muted)', 'margin-bottom': '6px' }}>工具列表（{server.tools.length} 个）</div>
                    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
                      <For each={server.tools}>
                        {(tool) => (
                          <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.02)', 'border-radius': '3px' }}>
                            <div style={{ 'font-size': '12px', 'font-weight': '500' }}>{tool.name}</div>
                            <div style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>{tool.description}</div>
                            <Show when={Object.keys(tool.params).length > 0}>
                              <div style={{ 'font-size': '10px', color: 'var(--text-muted)', 'margin-top': '4px', 'font-family': '"JetBrains Mono", monospace' }}>
                                参数: {Object.entries(tool.params).map(([k, v]) => `${k}(${v.type}${v.required ? '' : '?'})`).join(', ')}
                              </div>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>
            )
          }}
        </For>
      </div>
    </>
  )
}
