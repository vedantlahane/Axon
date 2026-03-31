import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/animations.css'
import './styles/utilities.css'
import App from './App.tsx'
import { applyTheme, resolveInitialTheme } from './utils/theme'

applyTheme(resolveInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
