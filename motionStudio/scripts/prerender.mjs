#!/usr/bin/env node
/**
 * Runs after `vite build`. Snapshots real, fully-rendered HTML for the two
 * public routes so crawlers and link-preview bots (most of which don't
 * execute JS) see actual content instead of an empty `<div id="root">`.
 *
 * **Why `dist/index.html` gets split into two files first.** Today it does
 * two jobs at once: the document for `/`, *and* — via `vercel.json`'s
 * catch-all rewrite — the fallback shell for every other route
 * (`/dashboard`, `/editor/:id`, anything unmatched). Overwriting it with the
 * landing page's real markup would make *every other route's first paint* a
 * flash of landing-page content before React Router corrects it. So the
 * as-built shell is copied to `dist/app.html` — untouched except for an
 * added `noindex`, since it's the shell for private, authenticated routes
 * now — and `vercel.json`'s rewrite destination points there instead.
 * `dist/index.html` is then free to become the real landing page.
 *
 * Real users are unaffected either way: React mounts over whichever static
 * markup is already there — the skeleton today, real content after this —
 * exactly as it always has. This only changes what a non-JS request sees.
 */
import { chromium } from 'playwright';
import { preview } from 'vite';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

// 1. Split the shell from the landing page (see module doc above).
copyFileSync(join(dist, 'index.html'), join(dist, 'app.html'));
const shell = readFileSync(join(dist, 'app.html'), 'utf8');
writeFileSync(
  join(dist, 'app.html'),
  shell.replace('</head>', '  <meta name="robots" content="noindex" />\n  </head>'),
);

// 2. Serve the just-built dist/ so Playwright has something real to load —
//    Vite's own `preview()` API, not a second static-file-serving dependency.
//    Default `appType: 'spa'` (unset in vite.config.ts) means it already
//    falls back to index.html for unmatched paths, the same shape as
//    vercel.json's rewrite, which is all this script needs from it.
const server = await preview({ root, preview: { port: 0 } });
// Read the bound port straight from the Node http.Server rather than
// `resolvedUrls` — that field is documented as `null` when nothing has
// been printed yet, which an ephemeral `port: 0` doesn't guarantee.
const { port } = server.httpServer.address();
const baseUrl = `http://localhost:${port}`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();

  for (const { path, outFile } of [
    { path: '/', outFile: join(dist, 'index.html') },
    { path: '/contact', outFile: join(dist, 'contact', 'index.html') },
  ]) {
    await page.goto(new URL(path, baseUrl).href, { waitUntil: 'networkidle' });
    // The landing page gates its real content behind an async auth check
    // (`if (loading) return <spinner>`) — .animate-spin is that spinner's
    // class. Waiting for its absence is a generic "the real page is showing
    // now" signal that costs the contact page nothing, since it never has
    // that spinner to begin with.
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 10_000 });

    const html = await page.content();
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, html);
    console.log(`\x1b[32m✓\x1b[0m prerendered ${path} → ${outFile.replace(root + '/', '')}`);
  }
} finally {
  await browser.close();
  await server.close();
}
