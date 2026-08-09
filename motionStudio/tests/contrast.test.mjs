import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const C = await import('./contrast.bundle.js');
let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? ' ok ' : 'FAIL'}  ${name}`); };

/* Read the real stylesheet rather than a copy of the values. A test that
   restates the palette would keep passing after someone edited index.css,
   which is the one thing it exists to catch. `MS_SRC` is set by run.mjs —
   this file executes from a temp dir, so there is no relative path home. */
const css = readFileSync(join(process.env.MS_SRC, 'index.css'), 'utf8');

function token(name) {
  const match = new RegExp(`--${name}:\\s*(oklch\\([^)]*\\))`).exec(css);
  if (!match) throw new Error(`token --${name} not found in index.css`);
  const parsed = C.parseOklch(match[1]);
  if (!parsed) throw new Error(`token --${name} is not parseable oklch: ${match[1]}`);
  return parsed;
}

const surfaces = {
  bg: token('studio-bg').rgb,
  panel: token('studio-panel').rgb,
  surface: token('studio-surface').rgb,
};

/* WCAG 1.4.3 for normal text. Not the 3:1 large-text exemption: these tokens
   are used at 9-11px throughout the editor, which is nobody's definition of
   large. */
const AA_TEXT = 4.5;

function worstAgainstSurfaces(rgb) {
  return Math.min(...Object.values(surfaces).map((bg) => C.contrastRatio(rgb, bg)));
}

// ── The text ramp ─────────────────────────────────────────────────────────
for (const name of ['studio-text', 'studio-text-secondary', 'studio-text-muted', 'studio-text-faint']) {
  const ratio = worstAgainstSurfaces(token(name).rgb);
  check(
    `--${name} clears AA on every surface (${ratio.toFixed(2)}:1)`,
    ratio >= AA_TEXT,
  );
}

// The ramp has to stay a ramp. Lifting `text-faint` to pass AA parked it next
// to `muted`; without this the two could quietly converge again and the
// hierarchy would be four names for two colours.
{
  const lightness = ['studio-text', 'studio-text-secondary', 'studio-text-muted', 'studio-text-faint']
    .map((n) => Number(/oklch\(\s*([\d.]+)/.exec(new RegExp(`--${n}:\\s*(oklch\\([^)]*\\))`).exec(css)[1])[1]));
  const descending = lightness.every((v, i) => i === 0 || lightness[i - 1] > v);
  check('the text ramp descends in lightness', descending);
  const gaps = lightness.slice(1).map((v, i) => lightness[i] - v);
  check(
    `each step is perceptible (min gap ${Math.min(...gaps).toFixed(3)})`,
    Math.min(...gaps) >= 0.06,
  );
}

// ── Accent as text ────────────────────────────────────────────────────────
{
  const ratio = worstAgainstSurfaces(token('studio-accent-text').rgb);
  check(`--studio-accent-text clears AA (${ratio.toFixed(2)}:1)`, ratio >= AA_TEXT);
}

/* A white label on a violet-500 fill — every primary button in the app —
   measures 4.01:1, short of the 4.5 it should clear. Fixing it means darkening
   the brand violet, which is an identity decision rather than an accessibility
   one, so it is deliberately still open.

   The floor is asserted anyway so the gap can only close, never widen: a
   future palette edit that pushes primary buttons further below AA fails here
   instead of shipping. Raise this to AA_TEXT when the accent ramp is settled. */
const ACCENT_BUTTON_FLOOR = 4.0;
{
  const ratio = C.contrastRatio(token('studio-accent').rgb, token('primary-foreground').rgb);
  check(
    `accent buttons hold their known floor (${ratio.toFixed(2)}:1, target ${AA_TEXT})`,
    ratio >= ACCENT_BUTTON_FLOOR,
  );
}

// ── Focus ring ────────────────────────────────────────────────────────────
/* WCAG 2.2 SC 2.4.11 wants 3:1 for a focus indicator. Measured as actually
   drawn: `--ring` composited at whatever opacity the base layer applies. This
   used to be a 28%-alpha accent halved again by `outline-ring/50`, landing at
   1.39:1 — which is why the opacity is read from the stylesheet here rather
   than assumed. */
{
  const ring = token('studio-accent-text');
  const applied = /@apply[^;]*\boutline-ring(?:\/(\d+))?\b/.exec(css);
  check('the base layer applies a focus ring', applied !== null);
  const opacity = applied?.[1] ? Number(applied[1]) / 100 : 1;
  const worst = Math.min(
    ...Object.values(surfaces).map((bg) => C.contrastRatio(C.over(ring.rgb, ring.alpha * opacity, bg), bg)),
  );
  check(
    `the focus ring is visible as drawn (${worst.toFixed(2)}:1 at ${opacity * 100}% opacity)`,
    worst >= 3,
  );
}

// ── The maths itself ──────────────────────────────────────────────────────
// Anchors with known answers, so a broken conversion fails here rather than
// silently passing every palette check above.
{
  const white = { r: 1, g: 1, b: 1 };
  const black = { r: 0, g: 0, b: 0 };
  check('white on black is 21:1', Math.abs(C.contrastRatio(white, black) - 21) < 0.01);
  check('a colour against itself is 1:1', Math.abs(C.contrastRatio(white, white) - 1) < 0.001);
  check('contrast is symmetric', C.contrastRatio(white, black) === C.contrastRatio(black, white));
  // oklch(1 0 0) is white by definition.
  const fromOklch = C.oklchToRgb(1, 0, 0);
  check('oklch(1 0 0) converts to white', Math.abs(fromOklch.r - 1) < 0.01 && Math.abs(fromOklch.b - 1) < 0.01);
  // Full alpha composites to the foreground; zero alpha to the backdrop.
  check('alpha 1 keeps the foreground', C.over(white, 1, black).r === 1);
  check('alpha 0 keeps the backdrop', C.over(white, 0, black).r === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
