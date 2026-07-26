import type { ShaderPreset, TextEffect } from '@/engines/project';
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

/** Full-canvas shader backdrop, always the bottom layer. */
function bg(
  shader: ShaderPreset,
  width: number,
  height: number,
  durationInFrames: number,
  shaderSpeed = 1,
): TemplateElement {
  return {
    type: 'shader',
    shader,
    shaderSpeed,
    x: 0,
    y: 0,
    width,
    height,
    rotation: 0,
    opacity: 1,
    zIndex: 0,
    startFrame: 0,
    durationInFrames,
  };
}

interface TextSpec {
  content: string;
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
    color: spec.color ?? '#ffffff',
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
      text({ content: 'JUST SHIPPED', x: 160, y: 300, width: 1600, height: 90, fontSize: 42, zIndex: 1, durationInFrames: S10, effect: 'tracking-in' }),
      text({ content: 'Dark mode is live', x: 160, y: 420, width: 1600, height: 240, fontSize: 130, zIndex: 2, durationInFrames: S10, effect: 'per-character-rise' }),
      text({ content: 'yourapp.com', x: 160, y: 690, width: 1600, height: 90, fontSize: 38, zIndex: 3, durationInFrames: S10, effect: 'soft-blur-in' }),
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
      text({ content: 'NOW LIVE', x: 160, y: 380, width: 1600, height: 280, fontSize: 170, zIndex: 1, durationInFrames: S10, effect: 'kinetic-center-build' }),
      text({ content: 'Version 2.0 is here', x: 160, y: 700, width: 1600, height: 100, fontSize: 44, zIndex: 2, durationInFrames: S10, effect: 'staggered-fade-up' }),
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
      text({ content: 'COMING SOON', x: 90, y: 780, width: 900, height: 280, fontSize: 100, zIndex: 1, durationInFrames: S10, effect: 'mask-reveal-up' }),
      text({ content: 'Something new. Very soon.', x: 90, y: 1110, width: 900, height: 120, fontSize: 40, zIndex: 2, durationInFrames: S10, effect: 'soft-blur-in' }),
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
      text({ content: '10,000', x: 90, y: 360, width: 900, height: 300, fontSize: 190, zIndex: 1, durationInFrames: S10, effect: 'spring-scale-in' }),
      text({ content: 'users and counting', x: 90, y: 690, width: 900, height: 110, fontSize: 44, zIndex: 2, durationInFrames: S10, effect: 'staggered-fade-up' }),
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
      bg('shader-dot-orbit', LAND.w, LAND.h, S15),
      text({ content: "WHAT'S NEW", x: 160, y: 260, width: 1600, height: 90, fontSize: 42, zIndex: 1, durationInFrames: S15, effect: 'tracking-in' }),
      text({ content: 'Faster exports\nNew shader backgrounds\nKeyboard shortcuts', x: 160, y: 400, width: 1600, height: 420, fontSize: 72, zIndex: 2, durationInFrames: S15, effect: 'line-by-line-slide' }),
    ],
  },

  /* ── Hook ─────────────────────────────────────────────────────────── */
  {
    id: 'bold-question',
    name: 'Bold question',
    description: 'Open a Reel or Short with a question that stops the scroll.',
    category: 'hook',
    aspectRatio: '9:16',
    fps: 30,
    durationInSeconds: 10,
    elements: [
      bg('shader-liquid-metal', PORT.w, PORT.h, S10),
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
      text({ content: '— Someone wise', x: 90, y: 720, width: 900, height: 100, fontSize: 40, zIndex: 2, durationInFrames: S10, effect: 'soft-blur-in' }),
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
      bg('shader-god-rays', PORT.w, PORT.h, S10),
      text({ content: '93%', x: 90, y: 700, width: 900, height: 320, fontSize: 220, zIndex: 1, durationInFrames: S10, effect: 'spring-scale-in' }),
      text({ content: 'of users never read the docs', x: 90, y: 1070, width: 900, height: 200, fontSize: 52, zIndex: 2, durationInFrames: S10, effect: 'staggered-fade-up' }),
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
      text({ content: 'Wait for it...', x: 90, y: 850, width: 900, height: 220, fontSize: 80, zIndex: 1, durationInFrames: 120, effect: 'typewriter' }),
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
      bg('shader-pulsing-border', SQ.w, SQ.h, S10),
      text({ content: '30% OFF', x: 90, y: 350, width: 900, height: 300, fontSize: 175, zIndex: 1, durationInFrames: S10, effect: 'micro-scale-fade' }),
      text({ content: 'This week only', x: 90, y: 680, width: 900, height: 110, fontSize: 48, zIndex: 2, durationInFrames: S10, effect: 'tracking-in' }),
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
      bg('shader-metaballs', PORT.w, PORT.h, S10),
      text({ content: 'NEW DROP', x: 90, y: 640, width: 900, height: 140, fontSize: 56, zIndex: 1, durationInFrames: S10, effect: 'tracking-in' }),
      text({ content: 'The Everyday Tee', x: 90, y: 820, width: 900, height: 340, fontSize: 104, zIndex: 2, durationInFrames: S10, effect: 'mask-reveal-up' }),
      text({ content: 'Available now', x: 90, y: 1210, width: 900, height: 110, fontSize: 42, zIndex: 3, durationInFrames: S10, effect: 'soft-blur-in' }),
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
      text({ content: '— Happy customer', x: 90, y: 760, width: 900, height: 100, fontSize: 40, zIndex: 2, durationInFrames: S15, effect: 'soft-blur-in' }),
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
