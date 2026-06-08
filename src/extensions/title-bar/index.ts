import { registry } from '@/registry'
import { TitleBar } from './TitleBar'

registry.register({
  id: 'title-bar',
  slot: 'overlay',
  component: TitleBar,
})
