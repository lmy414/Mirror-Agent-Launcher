import { Minus, Square, X } from 'lucide-solid'
import { windowMinimize, windowMaximize, windowClose } from '@/bridge/ipc-client'
import './window-controls.css'

export function WindowControls() {
  return (
    <div class="window-controls">
      <button class="wc-btn wc-minimize" onClick={windowMinimize} title="最小化">
        <Minus size={14} />
      </button>
      <button class="wc-btn wc-maximize" onClick={windowMaximize} title="最大化">
        <Square size={12} />
      </button>
      <button class="wc-btn wc-close" onClick={windowClose} title="关闭">
        <X size={14} />
      </button>
    </div>
  )
}
