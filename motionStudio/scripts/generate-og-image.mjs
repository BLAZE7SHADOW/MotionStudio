#!/usr/bin/env node
/**
 * Renders og-card.html and screenshots it to public/og-image.png.
 *
 * Run by hand (`node scripts/generate-og-image.mjs`), not on every build —
 * the image is static brand content that doesn't change per-deploy. Re-run
 * it only when og-card.html itself changes.
 */
import { chromium } from 'playwright';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, 'og-card.html');
const dest = join(here, '..', 'public', 'og-image.png');

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(pathToFileURL(source).href);
  await page.evaluate(() => document.fonts.ready); // don't screenshot with fallback fonts mid-swap
  await page.screenshot({ path: dest });
  console.log(`\x1b[32m✓\x1b[0m wrote ${dest}`);
} finally {
  await browser.close();
}
