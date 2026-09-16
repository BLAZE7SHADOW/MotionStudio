import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

/* The API's env lives at the repo root (it is a separate npm project), so Vite
   — rooted at motionStudio/ — never loads it. Read it here so the bucket name
   below comes from the same variable the server uses locally, instead of a
   parallel copy that can drift. On Vercel the variable is already in
   process.env, so this is a no-op there. */
function loadRootEnv(): void {
  const file = path.resolve(__dirname, '../.env')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2]
    }
  }
}
loadRootEnv()

/* One bucket, one variable.
 *
 * The client needs the assets bucket to rebuild each asset's URL from its
 * stored key, and Vite only exposes VITE_-prefixed vars to the browser — so the
 * first version of this shipped a second variable, VITE_S3_ASSETS_BUCKET,
 * duplicating S3_ASSETS_BUCKET. Two names for one value is the same class of
 * bug that broke every asset in the first place (bucket identity living
 * somewhere it could go stale), and it drifts silently: uploads land where the
 * app will never read from.
 *
 * The build already runs where the server's variable is available, so the
 * client's copy is derived from it here rather than maintained beside it.
 */
const assetsBucket = process.env.S3_ASSETS_BUCKET ?? ''
if (!assetsBucket) {
  console.warn(
    '[build] S3_ASSETS_BUCKET is not set — this build cannot resolve asset URLs, ' +
      'so cloud renders will be missing their media.',
  )
}

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
    __ASSETS_BUCKET__: JSON.stringify(assetsBucket),
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
