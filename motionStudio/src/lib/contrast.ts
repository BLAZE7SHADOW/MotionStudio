/**
 * WCAG contrast maths, so the palette can be checked rather than eyeballed.
 *
 * The design tokens are written in oklch, which is the right space to *pick*
 * colours in — perceptually uniform, so "lighten this a bit" means what you
 * expect. It is the wrong space to *judge* them in: WCAG 2.x contrast is
 * defined on sRGB relative luminance, and two colours with the same oklch
 * lightness can land either side of the 4.5:1 line depending on their chroma
 * and hue. Hence the conversion here.
 *
 * Kept free of React and of the app so `tests/contrast.test.mjs` can bundle it
 * alone — the same reason `notices.ts` and `placement.ts` are standalone.
 */

/** One channel of the sRGB → linear-light transform, per WCAG 2.x. */
function linearize(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

export interface Rgb { r: number; g: number; b: number }

/** WCAG relative luminance from sRGB components in 0–1. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** WCAG contrast ratio, 1–21. Order of arguments doesn't matter. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/* ── oklch → sRGB ──────────────────────────────────────────────────────────
   Oklab's own matrices (Björn Ottosson), then linear-sRGB → sRGB. Values are
   clamped at the end: a token can name a colour outside the sRGB gamut, and a
   browser clips it to the same place this does. */

export function oklchToRgb(l: number, c: number, hDegrees: number): Rgb {
  const h = (hDegrees * Math.PI) / 180;
  const a = c * Math.cos(h);
  const bb = c * Math.sin(h);

  const lp = l + 0.3963377774 * a + 0.2158037573 * bb;
  const mp = l - 0.1055613458 * a - 0.0638541728 * bb;
  const sp = l - 0.0894841775 * a - 1.2914855480 * bb;

  const lc = lp ** 3;
  const mc = mp ** 3;
  const sc = sp ** 3;

  const rLin = +4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  const gLin = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  const bLin = -0.0041960863 * lc - 0.7034186147 * mc + 1.7076147010 * sc;

  const encode = (v: number) => {
    const s = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
    return Math.min(1, Math.max(0, s));
  };

  return { r: encode(rLin), g: encode(gLin), b: encode(bLin) };
}

/**
 * Parse the `oklch(L C H)` / `oklch(L C H / A%)` forms used in `index.css`.
 *
 * Alpha is returned rather than applied — a translucent token has no contrast
 * of its own, only against a specific backdrop, so the caller has to composite
 * it first (see `over`).
 */
export function parseOklch(value: string): { rgb: Rgb; alpha: number } | null {
  const match = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?)\s*)?\)/.exec(value);
  if (!match) return null;
  const [, l, c, h, a, pct] = match;
  const alpha = a === undefined ? 1 : pct === '%' ? Number(a) / 100 : Number(a);
  return { rgb: oklchToRgb(Number(l), Number(c), Number(h)), alpha };
}

/** Composite a translucent foreground over an opaque backdrop. */
export function over(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return {
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha),
  };
}
