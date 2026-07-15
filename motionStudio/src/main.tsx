import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PostHogProvider } from 'posthog-js/react'
import './index.css'
import App from './App.tsx'

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
