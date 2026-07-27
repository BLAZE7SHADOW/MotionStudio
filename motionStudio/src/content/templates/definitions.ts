import type { ShaderPreset, TextEffect, BlockPreset, BlockProps } from '@/engines/project';
import type { TemplateDefinition, TemplateElement } from './types';

/**
 * The seed template set.
 *
 * Layout notes — geometry is composition space (16:9 = 1920×1080,
 * 9:16 = 1080×1920, 1:1 = 1080×1080), and a text element carrying a
 * `textEffect` renders centered inside its own box with `overflow: hidden`.
 * So boxes are sized generously: position the BOX where the text should sit,
 * and let the effect center within it.
 *
 * Every template is text + shader only — see the note on TemplateDefinition
 * for why templates can't ship media.
 */

const FONT = 'Inter, sans-serif';

/**
 * Palette, from Remocn's `references/design.md`. Templates stay inside it so
 * they read as one product rather than a swatch book.
 */
const INK = '#fafafa';      // primary text
const DIM = '#a1a1aa';      // secondary text — hierarchy without a second accent
const GREEN = '#22c55e';
const SKY = '#0ea5e9';
const VIOLET = '#a855f7';
const WARM = '#d97757';

/**
 * Full-canvas shader backdrop, always the bottom layer.
 *
 * The defaults are deliberately *restrained*. Remocn's anti-patterns doc calls
 * a bright, fast, full-frame gradient wash "the #1 tell" of generic-looking
 * work: a moving background is fine, but it has to be a **slow, muted** shader
 * that never competes with the text for attention. So speed defaults low and
 * the layer is knocked back with opacity rather than run at full strength —
 * the composition's own near-black shows through and keeps contrast high.
 */
function bg(
  shader: ShaderPreset,
  width: number,
  height: number,
  durationInFrames: number,
  { speed = 0.3, opacity = 0.35 }: { speed?: number; opacity?: number } = {},
): TemplateElement {
  return {
    type: 'shader',
    shader,
    shaderSpeed: speed,
    x: 0,
    y: 0,
    width,
    height,
    rotation: 0,
    opacity,
    zIndex: 0,
    startFrame: 0,
    durationInFrames,
  };
}

interface BlockSpec {
  preset: BlockPreset;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  durationInFrames: number;
  startFrame?: number;
  props?: BlockProps;
}

/**
 * A structured block. `durationInFrames` must be at least the block's natural
 * length or the animation gets cut off — see the validation in the template
 * check script.
 */
function block(spec: BlockSpec): TemplateElement {
  return {
    type: 'block',
    block: spec.preset,
    blockProps: spec.props ?? {},
    x: spec.x,
    y: spec.y,
    width: spec.width,
    height: spec.height,
    rotation: 0,
    opacity: 1,
    zIndex: spec.zIndex,
    startFrame: spec.startFrame ?? 0,
    durationInFrames: spec.durationInFrames,
  };
}

interface TextSpec {
  content: string;
  contentTo?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  zIndex: number;
  durationInFrames: number;
  color?: string;
  effect?: TextEffect;
  effectSpeed?: number;
  highlight?: string;
  startFrame?: number;
}

function text(spec: TextSpec): TemplateElement {
  return {
    type: 'text',
    content: spec.content,
    contentTo: spec.contentTo,
    x: spec.x,
    y: spec.y,
    width: spec.width,
    height: spec.height,
    rotation: 0,
    opacity: 1,
    zIndex: spec.zIndex,
    startFrame: spec.startFrame ?? 0,
    durationInFrames: spec.durationInFrames,
    fontSize: spec.fontSize,
    fontFamily: FONT,
    color: spec.color ?? INK,
    textEffect: spec.effect,
    textEffectSpeed: spec.effectSpeed,
    textEffectHighlight: spec.highlight,
  };
}

/* Frame budgets — every template runs at 30fps. */
const S5 = 150;
const S10 = 300;
const S15 = 450;

/* Canvas sizes */
const LAND = { w: 1920, h: 1080 };
const PORT = { w: 1080, h: 1920 };
const SQ = { w: 1080, h: 1080 };

export const TEMPLATES: TemplateDefinition[] = [
  /* ── Announce ─────────────────────────────────────────────────────── */
  {
    id: 'feature-shipped',
    name: 'Feature shipped',
    description: 'Announce something you just released.',
    category: 'announce',
    aspectRatio: '16:9',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-mesh-gradient', LAND.w, LAND.h, S10),
      text({ content: 'Just shipped', x: 160, y: 300, width: 1600, height: 90, fontSize: 42, zIndex: 1, durationInFrames: S10, color: GREEN, effect: 'tracking-in' }),
      text({ content: 'Dark mode is live', x: 160, y: 420, width: 1600, height: 240, fontSize: 130, zIndex: 2, durationInFrames: S10, effect: 'per-character-rise' }),
      text({ content: 'yourapp.com', x: 160, y: 690, width: 1600, height: 90, fontSize: 38, zIndex: 3, durationInFrames: S10, color: DIM, effect: 'soft-blur-in' }),
    ],
  },
  {
    id: 'now-live',
    name: 'Now live',
    description: 'A launch moment with a bold centered headline.',
    category: 'announce',
    aspectRatio: '16:9',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-warp', LAND.w, LAND.h, S10),
      text({ content: 'Now live', x: 160, y: 380, width: 1600, height: 280, fontSize: 170, zIndex: 1, durationInFrames: S10, effect: 'kinetic-center-build' }),
      text({ content: 'Version 2.0 is here', x: 160, y: 700, width: 1600, height: 100, fontSize: 44, zIndex: 2, durationInFrames: S10, color: SKY, effect: 'staggered-fade-up' }),
    ],
  },
  {
    id: 'coming-soon',
    name: 'Coming soon',
    description: 'Vertical teaser for something not out yet.',
    category: 'announce',
    aspectRatio: '9:16',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-smoke-ring', PORT.w, PORT.h, S10),
      text({ content: 'Coming soon', x: 90, y: 780, width: 900, height: 280, fontSize: 100, zIndex: 1, durationInFrames: S10, effect: 'mask-reveal-up' }),
      text({ content: 'Something new. Very soon.', x: 90, y: 1110, width: 900, height: 120, fontSize: 40, zIndex: 2, durationInFrames: S10, color: VIOLET, effect: 'soft-blur-in' }),
    ],
  },
  {
    id: 'metric-milestone',
    name: 'Metric milestone',
    description: 'Celebrate a number — users, downloads, revenue.',
    category: 'announce',
    aspectRatio: '1:1',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-grain-gradient', SQ.w, SQ.h, S10),
      text({ content: '10,000', x: 90, y: 360, width: 900, height: 300, fontSize: 190, zIndex: 1, durationInFrames: S10, color: GREEN, effect: 'spring-scale-in' }),
      text({ content: 'users and counting', x: 90, y: 690, width: 900, height: 110, fontSize: 44, zIndex: 2, durationInFrames: S10, color: DIM, effect: 'staggered-fade-up' }),
    ],
  },
  {
    id: 'changelog-drop',
    name: 'Changelog drop',
    description: "Several updates at once, revealed line by line.",
    category: 'announce',
    aspectRatio: '16:9',
    fps: 30,
    durationInSeconds: 15,
    elements: [
      bg('shader-dot-orbit', LAND.w, LAND.h, S15, { speed: 0.2, opacity: 0.18 }),
      text({ content: "What's new", x: 160, y: 260, width: 1600, height: 90, fontSize: 42, zIndex: 1, durationInFrames: S15, color: SKY, effect: 'tracking-in' }),
      text({ content: 'Faster exports\nNew shader backgrounds\nKeyboard shortcuts', x: 160, y: 400, width: 1600, height: 420, fontSize: 72, zIndex: 2, durationInFrames: S15, effect: 'line-by-line-slide' }),
    ],
  },

  {
    id: 'milestone-counter',
    name: 'Milestone counter',
    description: 'A number counting up to a milestone, with a confetti payoff.',
    category: 'announce',
    aspectRatio: '1:1',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-grain-gradient', SQ.w, SQ.h, S10),
      // the odometer scrolls digits vertically, so the box needs well over one
      // line of height or boxStyle's overflow:hidden crops the reel
      text({ content: '0', contentTo: '10000', x: 90, y: 280, width: 900, height: 440, fontSize: 150, zIndex: 1, durationInFrames: S10, color: GREEN, effect: 'rolling-number' }),
      text({ content: 'developers shipping faster', x: 90, y: 760, width: 900, height: 120, fontSize: 44, zIndex: 2, durationInFrames: S10, color: DIM, effect: 'staggered-fade-up' }),
      // fires after the counter lands, per the archetype's "one accent pop"
      block({ preset: 'confetti', x: 0, y: 0, width: SQ.w, height: SQ.h, zIndex: 3, startFrame: 150, durationInFrames: 150, props: { particleCount: 180, power: 20 } }),
    ],
  },

  /* ── Hook ─────────────────────────────────────────────────────────── */
  {
    id: 'before-after',
    name: 'Before → after',
    description: 'Strike out the old way, replace it with yours.',
    category: 'hook',
    aspectRatio: '9:16',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-warp', PORT.w, PORT.h, S10),
      text({ content: 'Stop doing it the hard way', x: 90, y: 560, width: 900, height: 140, fontSize: 46, zIndex: 1, durationInFrames: S10, color: DIM, effect: 'tracking-in' }),
      text({ content: '3 hours of editing', contentTo: '30 seconds', x: 90, y: 780, width: 900, height: 400, fontSize: 78, zIndex: 2, durationInFrames: S10, effect: 'strikethrough-replace' }),
    ],
  },
  {
    id: 'price-reveal',
    name: 'Price reveal',
    description: 'Roll a price into view — launches, upgrades, discounts.',
    category: 'offer',
    aspectRatio: '1:1',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-liquid-metal', SQ.w, SQ.h, S10, { speed: 0.2, opacity: 0.22 }),
      text({ content: 'Launch pricing', x: 90, y: 280, width: 900, height: 120, fontSize: 46, zIndex: 1, durationInFrames: S10, color: DIM, effect: 'tracking-in' }),
      text({ content: '$99', contentTo: '$29', x: 90, y: 430, width: 900, height: 280, fontSize: 150, zIndex: 2, durationInFrames: S10, color: GREEN, effect: 'slot-machine-roll' }),
      text({ content: 'First 100 customers only', x: 90, y: 750, width: 900, height: 110, fontSize: 40, zIndex: 3, durationInFrames: S10, color: DIM, effect: 'soft-blur-in' }),
    ],
  },
  {
    id: 'bold-question',
    name: 'Bold question',
    description: 'Open a Reel or Short with a question that stops the scroll.',
    category: 'hook',
    aspectRatio: '9:16',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-liquid-metal', PORT.w, PORT.h, S10, { speed: 0.2, opacity: 0.22 }),
      text({ content: 'What if you could ship 10x faster?', x: 90, y: 700, width: 900, height: 520, fontSize: 96, zIndex: 1, durationInFrames: S10, effect: 'staggered-fade-up' }),
    ],
  },
  {
    id: 'quote-card',
    name: 'Quote card',
    description: 'A quote with attribution, square for the feed.',
    category: 'hook',
    aspectRatio: '1:1',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-perlin-noise', SQ.w, SQ.h, S10),
      text({ content: 'Ship it before\nyou feel ready.', x: 90, y: 330, width: 900, height: 340, fontSize: 92, zIndex: 1, durationInFrames: S10, effect: 'line-by-line-slide' }),
      text({ content: '— Someone wise', x: 90, y: 720, width: 900, height: 100, fontSize: 40, zIndex: 2, durationInFrames: S10, color: DIM, effect: 'soft-blur-in' }),
    ],
  },
  {
    id: 'stat-drop',
    name: 'Stat drop',
    description: 'Lead with a surprising number.',
    category: 'hook',
    aspectRatio: '9:16',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-god-rays', PORT.w, PORT.h, S10, { speed: 0.2, opacity: 0.22 }),
      text({ content: '93%', x: 90, y: 700, width: 900, height: 320, fontSize: 220, zIndex: 1, durationInFrames: S10, color: GREEN, effect: 'spring-scale-in' }),
      text({ content: 'of users never read the docs', x: 90, y: 1070, width: 900, height: 200, fontSize: 52, zIndex: 2, durationInFrames: S10, color: DIM, effect: 'staggered-fade-up' }),
    ],
  },
  {
    id: 'reveal-hook',
    name: 'Wait for it',
    description: 'A two-beat reveal — tease first, then hit.',
    category: 'hook',
    aspectRatio: '9:16',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-swirl', PORT.w, PORT.h, S10),
      text({ content: 'Wait for it...', x: 90, y: 850, width: 900, height: 220, fontSize: 80, zIndex: 1, durationInFrames: 120, color: DIM, effect: 'typewriter' }),
      text({ content: 'This changes everything', x: 90, y: 760, width: 900, height: 400, fontSize: 96, zIndex: 2, startFrame: 120, durationInFrames: 180, effect: 'rgb-glitch-text' }),
    ],
  },

  /* ── Offer ────────────────────────────────────────────────────────── */
  {
    id: 'new-offer',
    name: 'New offer',
    description: 'A discount or promotion with a deadline.',
    category: 'offer',
    aspectRatio: '1:1',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-pulsing-border', SQ.w, SQ.h, S10, { speed: 0.25, opacity: 0.3 }),
      text({ content: '30% off', x: 90, y: 350, width: 900, height: 300, fontSize: 175, zIndex: 1, durationInFrames: S10, color: WARM, effect: 'micro-scale-fade' }),
      text({ content: 'This week only', x: 90, y: 680, width: 900, height: 110, fontSize: 48, zIndex: 2, durationInFrames: S10, color: DIM, effect: 'tracking-in' }),
    ],
  },
  {
    id: 'product-drop',
    name: 'Product drop',
    description: 'Announce a new product or restock.',
    category: 'offer',
    aspectRatio: '9:16',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-metaballs', PORT.w, PORT.h, S10, { speed: 0.2, opacity: 0.22 }),
      text({ content: 'New drop', x: 90, y: 640, width: 900, height: 140, fontSize: 56, zIndex: 1, durationInFrames: S10, color: WARM, effect: 'tracking-in' }),
      text({ content: 'The Everyday Tee', x: 90, y: 820, width: 900, height: 340, fontSize: 104, zIndex: 2, durationInFrames: S10, effect: 'mask-reveal-up' }),
      text({ content: 'Available now', x: 90, y: 1210, width: 900, height: 110, fontSize: 42, zIndex: 3, durationInFrames: S10, color: DIM, effect: 'soft-blur-in' }),
    ],
  },
  {
    id: 'testimonial-card',
    name: 'Testimonial',
    description: 'A customer quote with the best bit highlighted.',
    category: 'offer',
    aspectRatio: '1:1',
    fps: 30,
    durationInSeconds: 15,
    elements: [
      bg('shader-simplex-noise', SQ.w, SQ.h, S15),
      text({ content: 'This saved us hours every week', x: 90, y: 330, width: 900, height: 380, fontSize: 84, zIndex: 1, durationInFrames: S15, effect: 'marker-highlight', highlight: 'hours every week' }),
      text({ content: '— Happy customer', x: 90, y: 760, width: 900, height: 100, fontSize: 40, zIndex: 2, durationInFrames: S15, color: DIM, effect: 'soft-blur-in' }),
    ],
  },

  /* ── Dev & Product ────────────────────────────────────────────────── */
  {
    id: 'cli-demo',
    name: 'CLI demo',
    description: 'Show a command running — the shape of a dev-tool clip.',
    category: 'dev',
    aspectRatio: '16:9',
    fps: 30,
    durationInSeconds: 15,
    elements: [
      bg('shader-dot-orbit', LAND.w, LAND.h, S15, { speed: 0.15, opacity: 0.14 }),
      text({ content: 'Ship it in one command', x: 160, y: 110, width: 1600, height: 150, fontSize: 62, zIndex: 1, durationInFrames: S15, effect: 'kinetic-center-build' }),
      block({
        preset: 'terminal-simulator',
        x: 260, y: 320, width: 1400, height: 620,
        zIndex: 2, startFrame: 90, durationInFrames: S15 - 90,
        props: {
          lines: '$ npx motionstudio build\nresolving composition...\nrendering 300 frames\n✓ done in 4.2s',
          title: '~/projects/my-app',
          prompt: '$',
          fontSize: 24,
        },
      }),
    ],
  },
  {
    id: 'code-drop',
    name: 'Code drop',
    description: 'Reveal a snippet in a frosted editor window.',
    category: 'dev',
    aspectRatio: '16:9',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-neuro-noise', LAND.w, LAND.h, S10, { speed: 0.2, opacity: 0.25 }),
      text({ content: 'Three lines. That’s the whole API.', x: 160, y: 120, width: 1600, height: 130, fontSize: 54, zIndex: 1, durationInFrames: S10, color: DIM, effect: 'soft-blur-in' }),
      block({
        preset: 'glass-code-block',
        x: 390, y: 300, width: 1140, height: 690,
        zIndex: 2, durationInFrames: S10,
        props: {
          code: 'import { render } from "motionstudio";\n\nawait render("./scene.tsx", {\n  format: "mp4",\n});',
          title: 'render.ts',
          fontSize: 26,
        },
      }),
    ],
  },
  {
    id: 'how-it-works',
    name: 'How it works',
    description: 'Three steps lighting up in sequence.',
    category: 'dev',
    aspectRatio: '16:9',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-mesh-gradient', LAND.w, LAND.h, S10),
      text({ content: 'How it works', x: 160, y: 280, width: 1600, height: 200, fontSize: 108, zIndex: 1, durationInFrames: S10, effect: 'per-character-rise' }),
      block({
        preset: 'progress-steps',
        x: 260, y: 580, width: 1400, height: 320,
        zIndex: 2, startFrame: 60, durationInFrames: S10 - 60,
        props: { steps: 'Connect\nGenerate\nShip', activeColor: GREEN, textColor: INK },
      }),
    ],
  },
  {
    id: 'stack-marquee',
    name: 'Stack marquee',
    description: 'A scrolling wall of names — tools, features, customers.',
    category: 'dev',
    aspectRatio: '16:9',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-dithering', LAND.w, LAND.h, S10, { speed: 0.2, opacity: 0.2 }),
      text({ content: 'Works with everything', x: 160, y: 140, width: 1600, height: 130, fontSize: 52, zIndex: 1, durationInFrames: S10, color: SKY, effect: 'tracking-in' }),
      text({ content: 'React\nTypeScript\nRemotion\nAWS Lambda\nSupabase', x: 0, y: 360, width: 1920, height: 420, fontSize: 84, zIndex: 2, durationInFrames: S10, effect: 'perspective-marquee' }),
    ],
  },

  /* ── Basic ────────────────────────────────────────────────────────── */
  {
    id: 'title-card',
    name: 'Title card',
    description: 'A clean opening title for any video.',
    category: 'basic',
    aspectRatio: '16:9',
    fps: 30,
    durationInSeconds: 5,
    elements: [
      bg('shader-mesh-gradient', LAND.w, LAND.h, S5),
      text({ content: 'Your Title Here', x: 160, y: 420, width: 1600, height: 240, fontSize: 140, zIndex: 1, durationInFrames: S5, effect: 'soft-blur-in' }),
    ],
  },
  {
    id: 'outro-cta',
    name: 'Outro / CTA',
    description: 'A closing call to action.',
    category: 'basic',
    aspectRatio: '16:9',
    fps: 30,
    durationInSeconds: 5,
    elements: [
      bg('shader-voronoi', LAND.w, LAND.h, S5),
      text({ content: 'Follow for more', x: 160, y: 420, width: 1600, height: 240, fontSize: 130, zIndex: 1, durationInFrames: S5, effect: 'bottom-up-letters' }),
    ],
  },
];
