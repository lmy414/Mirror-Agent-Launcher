import type { JSX } from 'solid-js'
import { createSignal, createMemo, For, createEffect } from 'solid-js'
import { accentRgb } from '@/shell/theme'

export function kbd(fn: () => void) {
  return {
    tabIndex: 0,
    role: 'button' as const,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn() }
    },
  }
}

/** hex → "R,G,B" */
export function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  return `${parseInt(h.substring(0, 2), 16)},${parseInt(h.substring(2, 4), 16)},${parseInt(h.substring(4, 6), 16)}`
}

/** "R,G,B" → hex */
export function rgbToHex(rgb: string): string {
  const [r, g, b] = rgb.split(',').map(Number)
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

export const ACCENT_SWATCHES = [
  '#6B8FA8', '#5B8C5A', '#C8963E', '#8B7FB8', '#7A8B94',
  '#E8553D', '#D4766B', '#6BA3BE', '#8FA86B', '#BE8FA3',
  '#A89060', '#6090A8', '#A86B8F', '#6BA88F', '#A86B6B',
]

export const GLASS_SWATCHES = [
  { name: '纯黑', rgb: '0,0,0' },
  { name: '深蓝', rgb: '8,12,24' },
  { name: '深灰', rgb: '18,18,18' },
  { name: '深绿', rgb: '6,14,10' },
  { name: '深紫', rgb: '14,8,20' },
  { name: '暖黑', rgb: '16,10,6' },
]

export function SectionTitle(props: { children: string }) {
  return (
    <div style={{ 'font-family': '"Noto Serif SC", serif', 'font-size': '14px', 'font-weight': '600', 'margin-bottom': '16px' }}>
      {props.children}
    </div>
  )
}

export function Btn(props: { children: JSX.Element; primary?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={props.onClick}
      style={{
        padding: '6px 14px', 'border-radius': '4px', cursor: 'pointer', 'font-family': 'inherit', 'font-size': '12px',
        background: props.primary ? `rgba(${accentRgb()},0.15)` : 'rgba(255,255,255,0.04)',
        border: props.primary ? `1px solid rgba(${accentRgb()},0.20)` : '1px solid rgba(255,255,255,0.06)',
        color: props.primary ? 'var(--accent)' : 'var(--text-secondary)',
      }}
    >
      {props.children}
    </button>
  )
}

export function ToggleButton(props: { enabled: boolean; onToggle: () => void }) {
  return (
    <div {...kbd(props.onToggle)} onClick={props.onToggle} style={{
      width: '32px', height: '18px', 'border-radius': '9px', cursor: 'pointer',
      background: props.enabled ? `rgba(${accentRgb()},0.40)` : 'rgba(255,255,255,0.10)',
      border: 'none', position: 'relative', transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: '2px', left: '2px', width: '14px', height: '14px',
        'border-radius': '50%', background: 'white', transition: 'transform 0.2s',
        transform: props.enabled ? 'translateX(14px)' : 'translateX(0)',
      }} />
    </div>
  )
}

// ── 表格/输入框共享样式 ──

export const thStyle: Record<string, string> = {
  'text-align': 'left', padding: '10px 12px', 'font-size': '10px', color: 'var(--text-muted)',
  'text-transform': 'uppercase', 'letter-spacing': '1px', 'border-bottom': '1px solid rgba(255,255,255,0.06)',
  'font-weight': '500',
}

export const tdStyle: Record<string, string> = {
  padding: '12px', 'border-bottom': '1px solid rgba(255,255,255,0.03)',
  'vertical-align': 'middle', color: 'var(--text-secondary)',
}

export const inputStyle: Record<string, string> = {
  flex: '1', background: 'rgba(0,0,0,0.40)', border: '1px solid rgba(255,255,255,0.06)',
  'border-radius': '4px', padding: '8px 12px', color: 'var(--text-primary)', 'font-size': '13px',
  'font-family': '"JetBrains Mono", monospace', outline: 'none',
}

// ── 系统页面链接（由 SystemPage 引用时渲染）──
export const DEVELOPER_LINKS = [
  { name: 'GitHub', url: 'https://github.com/lmy414' },
  { name: 'Bilibili', url: 'https://space.bilibili.com/321480847' },
]
