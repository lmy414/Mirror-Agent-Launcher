import { createSignal } from 'solid-js'

export type ViewId = 'chat' | 'logs' | 'settings'

export const [activeView, navigateTo] = createSignal<ViewId>('chat')
