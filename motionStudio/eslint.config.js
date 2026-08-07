import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // A leading underscore is how this codebase says "required by the
      // signature, deliberately unused" — see `deleteAssetFromStorage`, whose
      // parameters document the endpoint it will take once S3 deletion exists.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    /* ── vendored components ──
       `components/remocn` and `components/ui` are copy-paste installs from the
       remocn and shadcn registries (see `skills-lock.json`). They are updated by
       re-running the installer, which overwrites the file — so "fixing" lint in
       them is work that gets thrown away, and worse, a local edit silently
       disappears on the next sync.

       Both rules flag idioms the registries deliberately use:
       `interface XProps extends Omit<YProps, 'frame'> {}` names a derived type
       that has no members of its own, and shadcn exports `buttonVariants`
       alongside `Button`. Neither is a defect; both are someone else's house
       style, and this project's job is to consume them, not restyle them. */
    files: ['src/components/remocn/**', 'src/components/ui/**'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])
