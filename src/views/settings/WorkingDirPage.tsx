import { WorkingDirSection } from './WorkingDirSection'

export function WorkingDirPage() {
  const titleStyle = { 'font-family': '"Noto Serif SC", serif', 'font-size': '15px', 'font-weight': '600', color: 'var(--text-primary)' }

  return (
    <>
      <div style={{ ...titleStyle, 'margin-bottom': '2px' }}>工作目录</div>
      <div style={{ 'font-size': '12px', color: 'var(--text-muted)', 'margin-bottom': '20px' }}>
        配置常用工作目录，新建终端时可快速选择
      </div>
      <WorkingDirSection />
    </>
  )
}
