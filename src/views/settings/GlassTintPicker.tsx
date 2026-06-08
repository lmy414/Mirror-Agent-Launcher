import { createMemo, For } from 'solid-js'
import { kbd, rgbToHex, hexToRgb, GLASS_SWATCHES } from './shared'

export function GlassTintPicker(props: { value: string; onChange: (rgb: string) => void }) {
  const hexInput = createMemo(() => rgbToHex(props.value))

  const handleHexSubmit = (hex: string) => {
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) props.onChange(hexToRgb(hex))
  }

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px', 'flex-wrap': 'wrap' }}>
        <For each={GLASS_SWATCHES}>
          {(t) => {
            const isActive = createMemo(() => props.value === t.rgb)
            return (
              <div
                onClick={() => props.onChange(t.rgb)}
                {...kbd(() => props.onChange(t.rgb))}
                style={{
                  padding: '10px 14px', background: `rgba(${t.rgb},0.80)`,
                  border: `1.5px solid ${isActive() ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.06)'}`,
                  'box-shadow': isActive() ? '0 0 0 2px rgba(255,255,255,0.08)' : 'none',
                  'border-radius': '6px', cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: '6px',
                }}>
                <div style={{ width: '36px', height: '24px', 'border-radius': '4px', background: `rgba(${t.rgb},0.90)`, border: '1px solid rgba(255,255,255,0.06)' }} />
                <div style={{ 'font-size': '11px', color: isActive() ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{t.name}</div>
              </div>
            )
          }}
        </For>
      </div>
      <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
        <div style={{
          width: '24px', height: '24px', 'border-radius': '4px', 'flex-shrink': '0',
          background: `rgba(${props.value},0.90)`, border: '1px solid rgba(255,255,255,0.10)',
        }} />
        <input type="text" value={hexInput()}
          onKeyDown={(e) => { if (e.key === 'Enter') handleHexSubmit(e.currentTarget.value) }}
          onBlur={(e) => handleHexSubmit(e.currentTarget.value)}
          maxLength={7}
          style={{
            width: '80px', padding: '5px 8px', 'font-size': '12px',
            'font-family': '"JetBrains Mono", monospace',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            'border-radius': '4px', color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <span style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>HEX</span>
      </div>
    </div>
  )
}
