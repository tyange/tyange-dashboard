/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App.tsx'
import { applyTheme, loadStoredTheme } from './theme/ThemeProvider'

const root = document.getElementById('root')

applyTheme(loadStoredTheme())

render(() => <App />, root!)
