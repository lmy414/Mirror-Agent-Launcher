import { For } from 'solid-js'
import { accentRgb } from '@/shell/theme'
import { SectionTitle, DEVELOPER_LINKS } from './shared'
import { ExternalLink, Monitor } from 'lucide-solid'

export function SystemPage() {
  const linkIcons: Record<string, () => JSX.Element> = {
    GitHub: () => <ExternalLink size={16} />,
    Bilibili: () => <Monitor size={16} />,
  }

  return (
    <>
      <div style={{ display: 'flex', 'align-items': 'center', gap: '20px', padding: '20px', background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.04)', 'border-radius': '8px', 'margin-bottom': '24px' }}>
        <div style={{ width: '56px', height: '56px', 'border-radius': '8px', background: `rgba(${accentRgb()},0.15)`, border: `1px solid rgba(${accentRgb()},0.20)`, display: 'flex', 'align-items': 'center', 'justify-content': 'center', 'font-size': '24px', 'flex-shrink': '0' }}>M</div>
        <div style={{ flex: '1' }}>
          <div style={{ 'font-family': '"Noto Serif SC", serif', 'font-size': '18px', 'font-weight': '600', 'margin-bottom': '4px' }}>Mirror-Agent-Launcher</div>
          <div style={{ 'font-family': '"JetBrains Mono", monospace', 'font-size': '11px', color: 'var(--text-muted)' }}>v0.1beta · Electron</div>
        </div>
        <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'flex-end', gap: '4px' }}>
          <div style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>桌面框架: Electron</div>
          <div style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>前端: SolidJS + Tailwind CSS</div>
          <div style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>终端: xterm.js + node-pty</div>
          <div style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>语言: TypeScript</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: '1' }}>
          <SectionTitle>关于 Mirror-Agent-Launcher</SectionTitle>
          <div style={{ 'font-size': '12px', 'line-height': '1.7', color: 'var(--text-secondary)' }}>
            Mirror-Agent-Launcher 是一个统一的 CLI 智能体桌面管理工具。
            它可以让你在一个窗口中管理多个命令行 AI 助手（如 Claude Code、CodeWhale 等），
            通过内嵌终端直接与它们交互，支持多终端分屏、配置管理和运行状态追踪。
            当前处于早期开发阶段（0.1beta），核心功能正在逐步完善。
          </div>
        </div>
        <div style={{ flex: '1' }}>
          <SectionTitle>开发者链接</SectionTitle>
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
            <For each={DEVELOPER_LINKS}>
              {(link) => (
                <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', padding: '10px 14px', background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.04)', 'border-radius': '6px' }}>
                  <div style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
                    <span style={{ display: 'flex', 'align-items': 'center' }}>{linkIcons[link.name]?.()}</span>
                    <div>
                      <div style={{ 'font-size': '13px', 'font-weight': '500' }}>{link.name}</div>
                      <div style={{ 'font-size': '10px', color: 'var(--text-muted)', 'font-family': '"JetBrains Mono", monospace' }}>{link.url}</div>
                    </div>
                  </div>
                  <span style={{ 'font-size': '11px', color: 'var(--accent)', cursor: 'pointer' }} onClick={() => window.open(link.url, '_blank')}>打开 →</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </>
  )
}
