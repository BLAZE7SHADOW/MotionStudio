import path from 'node:path';
import { Config } from '@remotion/cli/config';

// Remotion's own bundler (used for CLI render + Lambda site deploy) doesn't
// know about Vite's `@/` -> `src/` path alias (vite.config.ts) — mirror it
// here so the same source compiles under both bundlers.
//
// NOTE: __dirname is unusable here — Remotion loads/transpiles this config
// file from inside its own @remotion/cli/dist directory, so __dirname
// resolves there, not to the project root. Remotion CLI commands (render,
// studio, lambda sites create) are always run from the project root via the
// package.json scripts, so process.cwd() is the reliable anchor.
Config.overrideWebpackConfig((currentConfig) => ({
  ...currentConfig,
  resolve: {
    ...currentConfig.resolve,
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
}));
