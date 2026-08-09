#!/usr/bin/env node
/**
 * A test runner in forty lines, because the alternative was a test framework.
 *
 * The modules worth testing here — `scenes.ts` and `projectLock.ts` — are pure
 * and dependency-free by design, so they need exactly two things: a bundler to
 * turn TypeScript into something node can import, and somewhere to stub the two
 * browser globals. esbuild already ships with Vite, so this costs no new
 * dependency and runs in under a second.
 *
 * Each `*.test.mjs` imports its subject from `./<name>.bundle.js`, which this
 * script produces first. Add a file, add a line to TARGETS.
 *
 *   npm test
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const TARGETS = [
  { test: 'scenes.test.mjs', src: 'src/engines/project/scenes.ts', bundle: 'scenes.bundle.js' },
  { test: 'scale.test.mjs', src: 'src/engines/timeline/scale.ts', bundle: 'scale.bundle.js' },
  { test: 'beatDetect.test.mjs', src: 'src/engines/audio/beatDetect.ts', bundle: 'beatDetect.bundle.js' },
  { test: 'transitions.test.mjs', src: 'src/engines/animation/transitions.ts', bundle: 'transitions.bundle.js' },
  { test: 'projectLock.test.mjs', src: 'src/lib/projectLock.ts', bundle: 'lock.cjs.js' },
  { test: 'notices.test.mjs', src: 'src/lib/notices.ts', bundle: 'notices.bundle.js' },
  { test: 'projectOwner.test.mjs', src: 'src/lib/projectOwner.ts', bundle: 'projectOwner.bundle.js' },
  { test: 'contrast.test.mjs', src: 'src/lib/contrast.ts', bundle: 'contrast.bundle.js' },
  { test: 'placement.test.mjs', src: 'src/engines/canvas/placement.ts', bundle: 'placement.bundle.js' },
  { test: 'migrations.test.mjs', src: 'src/engines/project/migrations.ts', bundle: 'migrations.bundle.js' },
  { test: 'forStorage.test.mjs', src: 'src/engines/project/forStorage.ts', bundle: 'forStorage.bundle.js' },
  { test: 'help.test.mjs', src: 'src/content/help.ts', bundle: 'help.bundle.js' },
  { test: 'quickStart.test.mjs', src: 'src/features/workspace/tour/quickStart.ts', bundle: 'quickStart.bundle.js' },
];

const work = mkdtempSync(join(tmpdir(), 'ms-tests-'));
let failed = 0;

try {
  for (const { test, src, bundle } of TARGETS) {
    console.log(`\n\x1b[1m${test}\x1b[0m`);
    execFileSync(
      'npx',
      /* `--tsconfig` is what teaches esbuild the `@/*` path alias. Subjects
         used to be leaf modules with only relative imports; `quickStart.ts`
         reaches for `@/engines/project/scenes`, and without this the bundle
         fails to resolve rather than failing a check. */
      ['esbuild', join(here, '..', src), '--bundle', '--format=esm',
       `--tsconfig=${join(here, '..', 'tsconfig.app.json')}`,
       `--outfile=${join(work, bundle)}`, '--log-level=error'],
      { stdio: 'inherit' },
    );
    copyFileSync(join(here, test), join(work, test));
    try {
      /* Tests run from a temp dir, so a relative path back to the source tree
         doesn't resolve. `contrast.test.mjs` reads `index.css` directly —
         asserting against a copy of the palette would keep passing after
         someone edited the real one. */
      execFileSync('node', [join(work, test)], {
        stdio: 'inherit',
        env: { ...process.env, MS_SRC: join(here, '..', 'src') },
      });
    } catch {
      failed++;
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failed) {
  console.error(`\n\x1b[31m${failed} test file(s) failed\x1b[0m`);
  process.exit(1);
}
console.log('\n\x1b[32mall test files passed\x1b[0m');
