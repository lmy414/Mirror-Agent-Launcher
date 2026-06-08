import { Minus, Square, X } from 'lucide-solid'
import { windowMinimize, windowMaximize, windowClose } from '@/bridge/ipc-client'
import './title-bar.css'

export function TitleBar() {
  return (
    <div class="title-bar" data-tauri-drag-region>
      {/* 左侧留空 — 留给 top-menu-toggle */}
      <div class="title-bar__spacer" />

      {/* 窗口控制按钮 — 右侧 */}
      <div class="title-bar__controls">
        <button class="tb-btn" onClick={windowMinimize} title="最小化">
          <Minus size={14} />
        </button>
        <button class="tb-btn" onClick={windowMaximize} title="最大化">
          <Square size={12} />
        </button>
        <button class="tb-btn tb-btn--close" onClick={windowClose} title="关闭">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
