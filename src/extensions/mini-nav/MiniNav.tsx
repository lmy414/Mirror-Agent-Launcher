import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import { MessageSquare, Activity, Settings } from 'lucide-solid'
import { activeView, navigateTo, type ViewId } from '@/shell/nav-signal'
import './mini-nav.css'

interface NavItem {
  id: ViewId
  icon: () => JSX.Element
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'chat', icon: () => <MessageSquare size={16} />, label: '通信' },
  { id: 'logs', icon: () => <Activity size={16} />, label: '日志' },
  { id: 'settings', icon: () => <Settings size={16} />, label: '設定' },
]

export function MiniNav() {
  return (
    <nav class="mini-nav">
      <For each={NAV_ITEMS}>
        {(item, idx) => (
          <button
            class="nav-item"
            classList={{
              active: activeView() === item.id,
              'is-first': idx() === 0,
            }}
            onClick={() => navigateTo(item.id)}
            title={item.label}
          >
            <span class="nav-icon">{item.icon()}</span>
            <span class="nav-label">{item.label}</span>
          </button>
        )}
      </For>
      <div class="nav-divider" />
    </nav>
  )
}
