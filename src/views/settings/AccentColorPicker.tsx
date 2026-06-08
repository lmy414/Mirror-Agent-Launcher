import { createSignal, createEffect, createMemo, For } from 'solid-js'
import { kbd, ACCENT_SWATCHES } from './shared'

export function AccentColorPicker(props: { value: string; onChange: (hex: string) => void }) {
  const [hexInput, setHexInput] = createSignal(props.value)

  createEffect(() => setHexInput(props.value))

  const handleHexSubmit = () => {
    let v = hexInput().trim()
    if (!v.startsWith('#')) v = '#' + v
    if (/^#[0-9a-fA-F]{6}$/.test(v)) props.onChange(v)
  }

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
      <div style={{ display: 'grid', 'grid-template-columns': 'repeat(5, 1fr)', gap: '8px' }}>
        <For each={ACCENT_SWATCHES}>
          {(swatch) => {
            const isActive = createMemo(() => props.value.toUpperCase() === swatch.toUpperCase())
            return (
              <div
                onClick={() => props.onChange(swatch)}
                {...kbd(() => props.onChange(swatch))}
                style={{
                  width: '100%', 'aspect-ratio': '1', 'border-radius': '6px',
                  background: swatch,
                  border: `1.5px solid ${isActive() ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.06)'}`,
                  'box-shadow': isActive() ? `0 0 0 2px ${swatch}40` : 'none',
                  cursor: 'pointer', transition: 'all 0.15s',
                  transform: isActive() ? 'scale(1.08)' : 'scale(1)',
                }}
              />
            )
          }}
        </For>
      </div>
      <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
        <div style={{
          width: '24px', height: '24px', 'border-radius': '4px', 'flex-shrink': '0',
          background: props.value, border: '1px solid rgba(255,255,255,0.10)',
        }} />
        <input type="text" value={hexInput()}
          onInput={(e) => setHexInput(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleHexSubmit() }}
          onBlur={handleHexSubmit}
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
