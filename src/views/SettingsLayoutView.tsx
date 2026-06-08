import type { JSX } from 'solid-js'
import { createSignal, For, Show } from 'solid-js'
import { accentRgb } from '@/shell/theme'
import { Settings, Palette, Info } from 'lucide-solid'
import { kbd } from './settings/shared'
import { AgentConfigPage } from './settings/AgentConfigPage'
import { DisplayPage } from './settings/DisplayPage'
import { SkillsPage } from './settings/SkillsPage'
import { SystemPage } from './settings/SystemPage'

type SettingsPage = 'model' | 'display' | 'system'

const NAV_ITEMS: { id: SettingsPage; icon: () => JSX.Element; label: string; desc: string }[] = [
  { id: 'model',   icon: () => <Settings size={14} />, label: '模型管理',   desc: 'API 密钥 · 模型选择 · 参数配置' },
  { id: 'display', icon: () => <Palette size={14} />,  label: '显示设置',   desc: '主题 · 壁纸 · 字体 · 布局' },
  { id: 'system',  icon: () => <Info size={14} />,     label: '系统信息',   desc: '版本 · 日志 · 关于澪号' },
]

export default function SettingsLayoutView() {
  const [page, setPage] = createSignal<SettingsPage>('model')

  return (
    <div class="glass-panel-full" style={{ display: 'flex' }}>
      <div class="bracket-tr"><div class="bracket-h" /><div class="bracket-v" /></div>

      {/* 左侧导航 */}
      <div style={{
        width: '260px', 'flex-shrink': '0', display: 'flex', 'flex-direction': 'column',
        'border-right': '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          display: 'flex', 'align-items': 'center', padding: '12px 16px', height: '54px',
          'font-family': '"Noto Serif SC", serif', 'font-size': '15px', 'font-weight': '600',
          background: 'rgb(var(--top-bar-tint-rgb))',
          'border-bottom': '1px solid rgba(255,255,255,0.03)', 'flex-shrink': '0',
        }}>設定</div>
        <div style={{ flex: '1', 'overflow-y': 'auto', padding: '8px 0' }}>
          <For each={NAV_ITEMS}>
            {(item) => (
              <div {...kbd(() => setPage(item.id))} onClick={() => setPage(item.id)} style={{
                display: 'flex', 'align-items': 'center', gap: '10px', padding: '10px 16px',
                cursor: 'pointer', transition: 'all 0.15s',
                'border-left': page() === item.id ? '2px solid var(--accent)' : '2px solid transparent',
                background: page() === item.id ? `rgba(${accentRgb()},0.06)` : 'transparent',
              }}>
                <span style={{ 'font-size': '14px', width: '20px', 'text-align': 'center', display: 'flex', 'align-items': 'center', 'justify-content': 'center' }}>{item.icon()}</span>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '1px' }}>
                  <div style={{ 'font-size': '13px' }}>{item.label}</div>
                  <div style={{ 'font-size': '10px', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* 右侧内容 */}
      <div style={{ flex: '1', display: 'flex', 'flex-direction': 'column', 'min-width': '0' }}>
        <div style={{
          display: 'flex', 'align-items': 'center', 'justify-content': 'space-between',
          padding: '12px 16px', height: '54px',
          background: 'rgb(var(--top-bar-tint-rgb))',
          'border-bottom': '1px solid rgba(255,255,255,0.03)', 'flex-shrink': '0',
        }}>
          <div style={{ 'font-family': '"Noto Serif SC", serif', 'font-size': '16px', 'font-weight': '600' }}>
            {NAV_ITEMS.find((n) => n.id === page())?.label ?? '设置'}
          </div>
          <div style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>
            設定 &gt; {NAV_ITEMS.find((n) => n.id === page())?.label ?? ''}
          </div>
        </div>
        <div style={{ flex: '1', 'overflow-y': 'auto', padding: '20px 24px' }}>
          <Show when={page() === 'model'}><AgentConfigPage /></Show>
          <Show when={page() === 'display'}><DisplayPage /></Show>
          <Show when={page() === 'system'}><SystemPage /></Show>
        </div>
      </div>
    </div>
  )
}
