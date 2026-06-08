/* @refresh reload */
import { render } from 'solid-js/web'
import { App } from './shell/App'
import './shell/App.css'
import './extensions/mini-nav'
import './extensions/sidebar'
import './extensions/title-bar'
import './views'

render(() => <App />, document.getElementById('root')!)
