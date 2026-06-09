import { createSignal, Show, For, onMount, createMemo, createEffect } from 'solid-js'
import { FileText, Wrench, Globe, Cpu } from 'lucide-solid'
import { configRead, configWrite, configProviders } from '@/bridge/ipc-client'
import './AgentConfigPage.css'

interface Props {
  toolId: string
  displayName: string
  installed: boolean
}

interface ProviderInfo {
  id: string
  label: string
  models: { id: string; label: string }[]
  sections: ConfigSection[]
}

interface ConfigField {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'path'
  description?: string
  defaultValue: unknown
  required: boolean
  options?: { label: string; value: string }[]
  placeholder?: string
}

interface ConfigSection {
  id: string
  label: string
  description?: string
  fields: ConfigField[]
}

/** 渲染单个表单字段 */
function FormField(props: {
  field: ConfigField
  value: unknown
  onChange: (value: unknown) => void
}) {
  const f = props.field
  return (
    <div class="agent-detail__field">
      <div class="agent-detail__label">{f.label}{f.required ? ' *' : ''}</div>
      <Show
        when={f.type === 'select'}
        fallback={
          <input
            class="agent-detail__input"
            type={f.type === 'number' ? 'number' : 'text'}
            value={(props.value as string) ?? ''}
            placeholder={f.placeholder ?? ''}
            onInput={(e) => props.onChange((e.currentTarget as HTMLInputElement).value)}
          />
        }
      >
        <select
          class="agent-detail__select"
          value={(props.value as string) ?? ''}
          onChange={(e) => props.onChange((e.currentTarget as HTMLSelectElement).value)}
        >
          <For each={f.options ?? []}>
            {(opt) => <option value={opt.value}>{opt.label}</option>}
          </For>
        </select>
      </Show>
      <Show when={f.description}>
        <div class="agent-detail__hint">{f.description}</div>
      </Show>
    </div>
  )
}

export function AgentDetailPanel(props: Props) {
  const [config, setConfig] = createSignal<Record<string, unknown>>({})
  const [providers, setProviders] = createSignal<ProviderInfo[]>([])
  const [provider, setProvider] = createSignal('')
  const [formValues, setFormValues] = createSignal<Record<string, unknown>>({})
  const [saved, setSaved] = createSignal(false)

  const currentProvider = createMemo(() =>
    providers().find((p) => p.id === provider())
  )

  // 切换工具时重新加载（SolidJS Show 复用组件，onMount 不重复触发）
  createEffect(() => {
    const tid = props.toolId
    // eslint-disable-next-line solid/reactivity
    ;(async () => {
    // 加载配置
    const cfgResult = await configRead(props.toolId)
    if (cfgResult.ok && cfgResult.data) {
      const cfg = cfgResult.data.config
      setConfig(cfg)
      const savedProvider = (cfg.provider as string) || ''
      if (savedProvider) setProvider(savedProvider)

      const vals: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(cfg)) {
        vals[k] = v
      }
      setFormValues(vals)
    }

    // 加载 providers
    const provResult = await configProviders(props.toolId)
    if (provResult.ok && provResult.data) {
      setProviders(provResult.data as ProviderInfo[])
      if (!provider() && provResult.data.length > 0) {
        setProvider(provResult.data[0].id)
      }

      const vals: Record<string, unknown> = {}
      for (const p of provResult.data as ProviderInfo[]) {
        for (const s of p.sections) {
          for (const f of s.fields as ConfigField[]) {
            if (!(f.key in vals)) {
              vals[f.key] = f.defaultValue
            }
          }
        }
      }
      setFormValues((prev) => ({ ...vals, ...prev }))
    }
    })()
  })

  const handleFieldChange = (key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    const partial: Record<string, unknown> = {
      provider: provider(),
    }
    // 合并当前 provider 表单的所有值
    Object.assign(partial, formValues())

    const result = await configWrite(props.toolId, partial)
    if (result.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleViewConfig = () => {
    if (window.electronAPI) {
      window.electronAPI.config.openFile(props.toolId)
    }
  }

  const hasProviders = () => providers().length > 0

  return (
    <>
      {/* Header */}
      <div class="agent-detail__header">
        <div class="agent-detail__title">
          <span
            class="agent-detail__title-dot"
            style={{ background: props.installed ? 'var(--success)' : 'var(--text-muted)' }}
          />
          {props.displayName}
        </div>
        <button class="agent-detail__view-config" onClick={handleViewConfig}>
          <FileText size={14} />
          查看原始配置
        </button>
      </div>

      <Show when={hasProviders()} fallback={
        <div style={{ padding: '40px 0', 'text-align': 'center', color: 'var(--text-muted)', opacity: '0.5' }}>
          <Wrench size={24} />
          <div style={{ 'margin-top': '8px', 'font-size': '13px' }}>此工具使用通用适配器</div>
          <div style={{ 'font-size': '11px', 'margin-top': '4px' }}>请在设置中编辑启动命令与工作目录</div>
        </div>
      }>
        {/* ── 厂商选择 ── */}
        <div class="agent-detail__card">
          <div class="agent-detail__card-title">
            <span class="agent-detail__card-title-icon"><Globe size={14} /></span>
            API 厂商
          </div>
          <div class="agent-detail__field">
            <div class="agent-detail__label">选择模型服务商</div>
            <select
              class="agent-detail__select"
              value={provider()}
              onChange={(e) => setProvider(e.currentTarget.value)}
            >
              <For each={providers()}>
                {(p) => <option value={p.id}>{p.label}</option>}
              </For>
            </select>
          </div>
        </div>

        {/* ── 厂商专属表单 ── */}
        <Show when={currentProvider()}>
          <For each={currentProvider()!.sections}>
            {(section) => (
              <div class="agent-detail__card">
                <div class="agent-detail__card-title">
                  <span class="agent-detail__card-title-icon"><Cpu size={14} /></span>
                  {section.label}
                </div>
                <Show when={section.description}>
                  <div class="agent-detail__hint" style={{ 'margin-bottom': '12px' }}>{section.description}</div>
                </Show>
                <For each={section.fields}>
                  {(field) => (
                    <FormField
                      field={field}
                      value={formValues()[field.key] ?? field.defaultValue}
                      onChange={(v) => handleFieldChange(field.key, v)}
                    />
                  )}
                </For>
              </div>
            )}
          </For>
        </Show>

        {/* ── 保存 ── */}
        <div class="agent-detail__save">
          <span class="agent-detail__save-status" classList={{ 'agent-detail__save-status--visible': saved() }}>
            ✓ 已保存
          </span>
          <button class="agent-detail__save-btn" onClick={handleSave}>
            保存配置
          </button>
        </div>
      </Show>
    </>
  )
}
