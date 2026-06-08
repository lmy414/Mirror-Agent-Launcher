import { registry } from '@/registry'
import { WindowControls } from './WindowControls'

registry.register({
  id: 'window-controls',
  slot: 'overlay',
  component: WindowControls,
})
