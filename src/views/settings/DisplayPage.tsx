import { createMemo, createSignal, For, Show, onMount } from 'solid-js'
import { THEMES, applyTheme, applyWallpaper, applyCustomAccent, applyGlassTint, applyTopBarTint, accentRgb, accentHex } from '@/shell/theme'
import { ColorPicker } from '@/components/color-picker'
import { settingsGetAll, settingsSet } from '@/bridge/ipc-client'
import { kbd, SectionTitle, GLASS_SWATCHES } from './shared'
import { Image } from 'lucide-solid'

export function DisplayPage() {
  const [settings, setSettings] = createSignal<Record<string, string>>({})

  onMount(async () => {
    const s = await settingsGetAll()
    setSettings(s)
    // 恢复已有设置到 CSS
    if (s['custom-accent']) applyCustomAccent(s['custom-accent'])
    if (s['glass-tint']) applyGlassTint(s['glass-tint'])
    if (s['top-bar-tint']) applyTopBarTint(s['top-bar-tint'])
    if (s['wallpaper']) applyWallpaper(s['wallpaper'])
    if (s['theme']) applyTheme(THEMES.find(t => t.id === s['theme']) ?? THEMES[0])
  })

  const get = (key: string) => settings()[key]
  const set = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    settingsSet(key, value)
  }

  const titleStyle: Record<string, string> = { 'font-family': '"Noto Serif SC", serif', 'font-size': '15px', 'font-weight': '600', color: 'var(--text-primary)' }
  const cardStyle: Record<string, string> = { background: '#0E0E1640', border: '1px solid rgba(255,255,255,0.024)', 'border-radius': '6px' }

  const currentWallpaper = createMemo(() => get('wallpaper') ?? '')

  const handleWallpaperBrowse = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        applyWallpaper(dataUrl)
        set('wallpaper', dataUrl)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleWallpaperReset = () => {
    applyWallpaper(null)
    set('wallpaper', '')
  }

  return (
    <>
      {/* 自定义颜色 */}
      <div style={{ ...titleStyle, 'margin-bottom': '12px' }}>自定义颜色</div>
      <div style={{ 'font-size': '12px', color: 'var(--text-muted)', 'margin-bottom': '12px' }}>选择任意颜色覆盖当前主题的强调色</div>
      <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', padding: '14px 16px', ...cardStyle }}>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
          <div style={{ 'font-size': '13px', 'font-weight': '500' }}>强调色</div>
          <div style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>
            {get('custom-accent') || '跟随主题'}
          </div>
        </div>
        <ColorPicker
          value={accentHex()}
          onChange={(hex) => { applyCustomAccent(hex); set('custom-accent', hex) }}
          onReset={() => { applyTheme(THEMES[0]); set('custom-accent', '') }}
          showReset={!!get('custom-accent')}
        />
      </div>

      <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)', opacity: '0.35', 'margin-bottom': '20px' }} />

      {/* 玻璃色调 */}
      <div style={{ ...titleStyle, 'margin-bottom': '12px' }}>背景颜色</div>
      <div style={{ 'font-size': '12px', color: 'var(--text-muted)', 'margin-bottom': '12px' }}>半透明玻璃面板的底色调</div>
      <div style={{ display: 'flex', gap: '12px', 'margin-bottom': '12px', 'flex-wrap': 'wrap' }}>
        <For each={GLASS_SWATCHES}>
          {(t) => {
            const currentGlassTint = createMemo(() => get('glass-tint') ?? '0,0,0')
            const isActive = createMemo(() => currentGlassTint() === t.rgb)
            return (
              <div
                onClick={() => { applyGlassTint(t.rgb); set('glass-tint', t.rgb) }}
                {...kbd(() => { applyGlassTint(t.rgb); set('glass-tint', t.rgb) })}
                style={{
                  padding: '12px 16px', background: `rgba(${t.rgb},0.80)`,
                  border: `1px solid ${isActive() ? 'var(--accent)' : 'rgba(255,255,255,0.06)'}`,
                  'border-radius': '6px', cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: '6px',
                }}>
                <div style={{ width: '40px', height: '28px', 'border-radius': '4px', background: `rgba(${t.rgb},0.90)`, border: '1px solid rgba(255,255,255,0.08)' }} />
                <div style={{ 'font-size': '11px', color: isActive() ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{t.name}</div>
              </div>
            )
          }}
        </For>
      </div>
      <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
        <span style={{ 'font-size': '12px', color: 'var(--text-muted)' }}>自定义</span>
        <ColorPicker
          value={(() => {
            const rgb = get('glass-tint') ?? '0,0,0'
            const [r, g, b] = rgb.split(',').map(Number)
            return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
          })()}
          onChange={(hex) => {
            const h = hex.replace('#', '')
            const rgb = `${parseInt(h.substring(0, 2), 16)},${parseInt(h.substring(2, 4), 16)},${parseInt(h.substring(4, 6), 16)}`
            applyGlassTint(rgb)
            set('glass-tint', rgb)
          }}
        />
      </div>

      <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)', opacity: '0.35', 'margin-bottom': '20px' }} />

      {/* 顶部标题栏颜色 */}
      <div style={{ ...titleStyle, 'margin-bottom': '12px' }}>顶部标题栏</div>
      <div style={{ 'font-size': '12px', color: 'var(--text-muted)', 'margin-bottom': '12px' }}>自定义顶部菜单栏的玻璃底色</div>
      <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
        <For each={[
          { name: '纯黑', rgb: '0,0,0' },
          { name: '深蓝', rgb: '8,12,24' },
          { name: '深灰', rgb: '18,18,18' },
          { name: '深紫', rgb: '14,8,20' },
          { name: '暖黑', rgb: '16,10,6' },
        ]}>
          {(t) => {
            const currentTopBarTint = createMemo(() => get('top-bar-tint') ?? '0,0,0')
            const isActive = createMemo(() => currentTopBarTint() === t.rgb)
            return (
              <div
                onClick={() => { applyTopBarTint(t.rgb); set('top-bar-tint', t.rgb) }}
                {...kbd(() => { applyTopBarTint(t.rgb); set('top-bar-tint', t.rgb) })}
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
        <ColorPicker
          value={(() => {
            const rgb = get('top-bar-tint') ?? '0,0,0'
            const [r, g, b] = rgb.split(',').map(Number)
            return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
          })()}
          onChange={(hex) => {
            const h = hex.replace('#', '')
            const rgb = `${parseInt(h.substring(0, 2), 16)},${parseInt(h.substring(2, 4), 16)},${parseInt(h.substring(4, 6), 16)}`
            applyTopBarTint(rgb)
            set('top-bar-tint', rgb)
          }}
        />
      </div>

      <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)', opacity: '0.35', 'margin-bottom': '20px' }} />

      {/* 壁纸 */}
      <div style={{ ...titleStyle, 'margin-bottom': '12px' }}>界面背景图</div>
      <div style={{ 'font-size': '12px', color: 'var(--text-muted)', 'margin-bottom': '12px' }}>选择一张图片作为全局背景</div>
      <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', padding: '14px 16px', ...cardStyle }}>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
          <div style={{ 'font-size': '13px', 'font-weight': '500' }}>全局背景</div>
          <div style={{ 'font-size': '11px', color: 'var(--text-muted)' }}>
            {currentWallpaper().startsWith('data:') ? '自定义图片' : currentWallpaper()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ width: '64px', height: '40px', display: 'flex', 'align-items': 'center', 'justify-content': 'center', background: 'rgba(255,255,255,0.024)', border: '1px solid rgba(255,255,255,0.05)', 'border-radius': '4px', overflow: 'hidden' }}>
            <Show when={currentWallpaper()} fallback={<Image size={16} />}>
              <img src={currentWallpaper()} style={{ width: '100%', height: '100%', 'object-fit': 'cover' }} />
            </Show>
          </div>
          <div onClick={handleWallpaperBrowse} {...kbd(handleWallpaperBrowse)} style={{ display: 'flex', 'align-items': 'center', padding: '7px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', 'border-radius': '4px', cursor: 'pointer' }}>
            <span style={{ 'font-size': '11px', 'font-weight': '500', color: 'var(--text-secondary)' }}>浏览</span>
          </div>
          <Show when={!!currentWallpaper()}>
            <div onClick={handleWallpaperReset} {...kbd(handleWallpaperReset)} style={{ display: 'flex', 'align-items': 'center', padding: '7px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', 'border-radius': '4px', cursor: 'pointer' }}>
              <span style={{ 'font-size': '11px', 'font-weight': '500', color: 'var(--text-muted)' }}>重置</span>
            </div>
          </Show>
        </div>
      </div>

    </>
  )
}
