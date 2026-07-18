import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Pre-bundle at dev-server startup instead of on first lazy-import — without
    // this, the FIRST time any shader effect is used in a session, Vite compiles
    // this (large, WebGL-heavy) dependency on demand, showing several seconds of
    // blank canvas before the shader's first paint. Production builds don't have
    // this problem (everything is pre-bundled), so this is dev-only.
    include: ['@paper-design/shaders-react'],
  },
})
