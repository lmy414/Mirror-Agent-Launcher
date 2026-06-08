/* @refresh reload */
import { render } from 'solid-js/web'
import { AgentProvider } from './shell/useAgent'
import { App } from './shell/App'
import './shell/App.css'
import './extensions/mini-nav'
import './extensions/session-panel'
import './extensions/sidebar'
import './extensions/top-menu'
import './extensions/title-bar'
import './views'

render(() => (
  <AgentProvider sessionId="sess-default">
    <App />
  </AgentProvider>
), document.getElementById('root')!)
