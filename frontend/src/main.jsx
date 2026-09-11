import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyTheme, loadTheme } from './theme.js'

// Aplica el tema de color guardado (o el de fábrica) antes del primer
// render, para que no haya un "parpadeo" de colores por defecto y luego el
// tema personalizado del usuario.
applyTheme(loadTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
