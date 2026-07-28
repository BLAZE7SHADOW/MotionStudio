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
  { test: 'projectLock.test.mjs', src: 'src/lib/projectLock.ts', bundle: 'lock.cjs.js' },
];

const work = mkdtempSync(join(tmpdir(), 'ms-tests-'));
let failed = 0;

try {
  for (const { test, src, bundle } of TARGETS) {
    console.log(`\n\x1b[1m${test}\x1b[0m`);
    execFileSync(
      'npx',
      ['esbuild', join(here, '..', src), '--bundle', '--format=esm',
       `--outfile=${join(work, bundle)}`, '--log-level=error'],
      { stdio: 'inherit' },
    );
    copyFileSync(join(here, test), join(work, test));
    try {
      execFileSync('node', [join(work, test)], { stdio: 'inherit' });
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
