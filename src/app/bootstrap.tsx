import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './providers/GameProvider'
import App from './App'

export function bootstrap(rootElement: HTMLElement): void {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
