import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// Identifies this exact build so a running tab can detect a newer deploy —
// Vercel sets this at build time; falls back to a timestamp for local builds.
const buildId = process.env.VERCEL_GIT_COMMIT_SHA ?? String(Date.now())

// Writes an unhashed, always-revalidated version.json next to the hashed
// (cache-forever) JS/CSS output — the client polls this to detect a new deploy.
function versionFilePlugin(): Plugin {
  return {
    name: 'write-version-file',
    closeBundle() {
      fs.writeFileSync(
        path.resolve(__dirname, 'dist/version.json'),
        JSON.stringify({ buildId }),
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    tailwindcss(),
    versionFilePlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // The /api functions are Vercel-hosted and don't exist under `vite dev`,
      // so without this every API call falls through to the SPA catch-all and
      // returns index.html — which surfaces as a baffling
      // `Unexpected token '<', "<!doctype "... is not valid JSON`.
      // Point at the deployment by default; set VITE_API_PROXY to a local
      // `vercel dev` (e.g. http://localhost:3000) to work on the API itself.
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'https://motionstudio-six.vercel.app',
        changeOrigin: true,
        secure: true,
      },
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
