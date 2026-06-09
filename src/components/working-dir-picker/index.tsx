import { createSignal, For, Show, onMount } from 'solid-js'
import { FolderOpen, Plus, X, FolderSearch } from 'lucide-solid'
import { dialogOpenDirectory, settingsGetAll, settingsSet } from '@/bridge/ipc-client'
import './index.css'

interface WorkingDirPickerProps {
  lastDir: string
  onConfirm: (path: string, addToGlobal: boolean) => void
  onCancel: () => void
}

export function WorkingDirPicker(props: WorkingDirPickerProps) {
  const [dirs, setDirs] = createSignal<string[]>([])
  const [selected, setSelected] = createSignal(props.lastDir || '')
  const [customPath, setCustomPath] = createSignal('')
  const [showAddConfirm, setShowAddConfirm] = createSignal(false)
  const [pendingBrowsePath, setPendingBrowsePath] = createSignal('')

  onMount(async () => {
    const all = await settingsGetAll()
    const raw = all['working-dirs']
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setDirs(parsed)
      } catch { /* ignore corrupt data */ }
    }
  })

  const addDir = async (path: string) => {
    if (!path || dirs().includes(path)) return
    const next = [...dirs(), path]
    setDirs(next)
    await settingsSet('working-dirs', JSON.stringify(next))
  }

  const removeDir = async (path: string) => {
    const next = dirs().filter((d) => d !== path)
    setDirs(next)
    await settingsSet('working-dirs', JSON.stringify(next))
  }

  const handleBrowse = async () => {
    const path = await dialogOpenDirectory()
    if (path) {
      setPendingBrowsePath(path)
      setSelected(path)
      setShowAddConfirm(true)
    }
  }

  const handleSelect = (path: string) => {
    setSelected(path)
    setShowAddConfirm(false)
  }

  const handleConfirm = () => {
    const final = selected() || customPath()
    if (final) {
      props.onConfirm(final, showAddConfirm() ? (() => { addDir(pendingBrowsePath()); return true })() : false)
    }
  }

  return (
    <div class="dir-picker-overlay" onClick={props.onCancel}>
      <div class="dir-picker" onClick={(e) => e.stopPropagation()}>
        <div class="dir-picker__header">
          <div class="dir-picker__title">
            <FolderOpen size={16} />
            <span>选择工作目录</span>
          </div>
        </div>

        <div class="dir-picker__body">
          {/* 已配置路径列表 */}
          <Show when={dirs().length > 0} fallback={
            <div class="dir-picker__empty">
              暂无已配置的工作目录，请浏览文件夹或手动输入
            </div>
          }>
            <div class="dir-picker__list">
              <For each={dirs()}>
                {(dir) => (
                  <div
                    class="dir-picker__item"
                    classList={{ 'dir-picker__item--selected': selected() === dir }}
                    onClick={() => handleSelect(dir)}
                  >
                    <span class="dir-picker__item-icon"><FolderSearch size={14} /></span>
                    <span class="dir-picker__item-path" title={dir}>{dir}</span>
                    <span
                      class="dir-picker__item-remove"
                      onClick={(e) => { e.stopPropagation(); removeDir(dir) }}
                    >
                      <X size={12} />
                    </span>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* 浏览文件夹 */}
          <button class="dir-picker__browse" onClick={handleBrowse}>
            <FolderOpen size={14} />
            浏览文件夹...
          </button>

          {/* 选中后询问是否加入全局目录 */}
          <Show when={showAddConfirm()}>
            <div class="dir-picker__add-confirm">
              <span>是否将「{pendingBrowsePath()}」加入全局工作目录？</span>
              <div class="dir-picker__add-confirm-btns">
                <button onClick={() => { addDir(pendingBrowsePath()); setShowAddConfirm(false) }}>是</button>
                <button onClick={() => setShowAddConfirm(false)}>否</button>
              </div>
            </div>
          </Show>

          {/* 自定义路径输入 */}
          <div class="dir-picker__divider">
            <span>或输入自定义路径</span>
          </div>
          <input
            class="dir-picker__input"
            type="text"
            placeholder="D:\Projects\my-agent"
            value={customPath()}
            onInput={(e) => { setCustomPath(e.currentTarget.value); setSelected('') }}
          />
        </div>

        <div class="dir-picker__footer">
          <button class="dir-picker__btn dir-picker__btn--cancel" onClick={props.onCancel}>
            取消
          </button>
          <button
            class="dir-picker__btn dir-picker__btn--confirm"
            disabled={!selected() && !customPath()}
            onClick={handleConfirm}
          >
            启动
          </button>
        </div>
      </div>
    </div>
  )
}
