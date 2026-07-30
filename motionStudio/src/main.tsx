import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PostHogProvider } from 'posthog-js/react'
import './index.css'
import App from './App.tsx'
import { installExceptionCapture } from './lib/exceptions'

// A lazy-loaded chunk (one of the 22 text effects / 18 shaders) can 404 if
// this tab is old enough that Vercel has pruned the deploy it was built
// against. Vite fires this event specifically for that case — safe to
// reload automatically here, since the import already failed either way.
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

// Before render, so a crash during the first paint is still reported.
installExceptionCapture()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_POSTHOG_HOST,
        defaults: '2026-05-30',
      }}
    >
      <App />
    </PostHogProvider>
  </StrictMode>,
)
