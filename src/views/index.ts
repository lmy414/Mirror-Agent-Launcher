import { registry } from '@/registry'
import PencilMainView from './PencilMainView'
import SettingsLayoutView from './SettingsLayoutView'
import LogsView from './LogsView'

registry.register({ id: 'chat',     slot: 'main-view', label: '通信',   component: PencilMainView })
registry.register({ id: 'settings', slot: 'main-view', label: '設定',   component: SettingsLayoutView })
registry.register({ id: 'logs',     slot: 'main-view', label: '日志',   component: LogsView })
