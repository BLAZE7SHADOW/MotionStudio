import type { TransitionId } from '../animation/transitions';

export type AspectRatio = '16:9' | '9:16' | '1:1';

/* ── Assets ── */

export type AssetType = 'image' | 'video' | 'audio';

/**
 * Source media in the project's library. An Asset is referenced by elements
 * (via assetId) — one asset can back many elements. `url` is an object URL for
 * uploaded files (session-scoped until we add persistence).
 */
export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  /** blob: URL — browser-only, valid for this session */
  url: string;
  /** public https: URL in Supabase Storage — usable by Lambda on AWS */
  storageUrl?: string;
  width?: number;               // natural pixel size (image / video)
  height?: number;
  durationInSeconds?: number;   // media length (video / audio)
  /* Beat analysis (audio only), cached so a file is measured once. Absent
     means "not analysed"; a present `bpm` of 0 means "analysed, no tempo
     found" — a distinction worth keeping, because one is worth retrying. */
  bpm?: number;
  beatOffsetSec?: number;
  beatConfidence?: number;
}

/**
 * The beat grid a project snaps to.
 *
 * Seeded from the first analysed audio asset, then editable — which is why it
 * lives on the project rather than on the asset. A user correcting the tempo is
 * not making a claim about the file, and the next project using the same track
 * should still start from what was detected.
 *
 * In **seconds**, always. Beats do not land on frames (at 128 BPM a beat is
 * 14.06 frames at 30fps), so frames are computed at the moment of snapping and
 * never stored — otherwise the error accumulates and the edit drifts.
 */
export interface BeatGrid {
  bpm: number;
  offsetSec: number;
  enabled: boolean;
}

/* ── Animation ── */

export type AnimationProperty = 'opacity' | 'x' | 'y' | 'scale' | 'rotate';
export type AnimationEasing = 'linear' | 'ease' | 'spring';

/**
 * One animated property. Values are relative to the element's base pose:
 *  - opacity, scale → factors (multiplied onto the base)
 *  - x, y, rotate   → offsets (added to the base)
 * Timed relative to the CLIP's start: the window is
 * [startOffset, startOffset + duration] in frames.
 */
export interface Animation {
  property: AnimationProperty;
  from: number;
  to: number;
  startOffset: number;
  duration: number;
  easing: AnimationEasing;
  /**
   * Who authored this. Absent means the user did.
   *
   * `'transition'` marks animations generated from a shot's transition, so
   * changing that transition replaces exactly its own work and never touches
   * something hand-made. It also keeps them out of the Motion panel: one thing
   * should be edited in one place, and offering a tweak the next transition
   * change would silently wipe is worse than not offering it.
   */
  source?: 'transition';
}

/* ── Canvas element types ── */

export type BaseElement = {
  id: string;
  type: string;
  /* geometry — stored in composition space (e.g. 1920×1080) */
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  /* temporal — Remotion <Sequence> model.
     `startFrame` is absolute, measured from the start of the whole video, and
     stays that way now that shots exist. See the note on `Scene`. */
  startFrame: number;
  durationInFrames: number;
  /* Which shot this element belongs to. Optional only so a project saved
     before shots existed still type-checks on the way in; `ensureScenes()`
     fills it before anything reads it. */
  sceneId?: string;
  /* motion — evaluated per frame relative to the clip start */
  animations?: Animation[];
};

export const TEXT_EFFECTS = [
  'soft-blur-in', 'blur-out-up', 'focus-blur-resolve',
  'tracking-in', 'per-character-rise', 'bottom-up-letters', 'top-down-letters',
  'spring-scale-in', 'micro-scale-fade', 'scale-down-fade',
  'staggered-fade-up', 'mask-reveal-up', 'line-by-line-slide',
  'kinetic-center-build', 'short-slide-right', 'short-slide-down',
  'shimmer-sweep', 'inline-highlight', 'marker-highlight',
  'typewriter', 'matrix-decode', 'rgb-glitch-text',
  'infinite-marquee',
  // list-valued — each line of `content` is one item
  'value-swap', 'rolodex-flip', 'perspective-marquee',
  // two-value — `content` is the "from", `contentTo` the "to"
  'fade-through', 'per-word-crossfade', 'shared-axis-y', 'shared-axis-z',
  'strikethrough-replace', 'slot-machine-roll',
  // two-value numeric — both parsed with Number()
  'rolling-number', 'number-wheel',
] as const;

export type TextEffect = typeof TEXT_EFFECTS[number];

/** Effects that read every line of `content` as a separate item. */
export const LIST_TEXT_EFFECTS = ['value-swap', 'rolodex-flip', 'perspective-marquee'] as const;

/** Effects that animate from `content` to `contentTo`. */
export const TWO_VALUE_TEXT_EFFECTS = [
  'fade-through', 'per-word-crossfade', 'shared-axis-y', 'shared-axis-z',
  'strikethrough-replace', 'slot-machine-roll', 'rolling-number', 'number-wheel',
] as const;

export function isTwoValueEffect(effect: TextEffect | undefined): boolean {
  return !!effect && (TWO_VALUE_TEXT_EFFECTS as readonly string[]).includes(effect);
}

export function isListEffect(effect: TextEffect | undefined): boolean {
  return !!effect && (LIST_TEXT_EFFECTS as readonly string[]).includes(effect);
}

/** Effects that count between two numbers rather than swapping two strings. */
export const NUMBER_TEXT_EFFECTS = ['rolling-number', 'number-wheel'] as const;

export function isNumberEffect(effect: TextEffect | undefined): boolean {
  return !!effect && (NUMBER_TEXT_EFFECTS as readonly string[]).includes(effect);
}

/**
 * The number a numeric effect will actually display for a given string, or
 * `null` if there is no number in it at all.
 *
 * Shared deliberately: the renderer needs a value it can always draw, and the
 * Properties panel needs to warn about exactly the cases the renderer will
 * quietly turn into 0. Two separate implementations would drift, and the panel
 * would end up reassuring the user about a frame that says something else.
 * Symbols and separators are stripped, so "$1,200" reads as 1200.
 */
export function parseEffectNumber(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.-]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export type TextElement = BaseElement & {
  type: 'text';
  content: string;
  /**
   * The "to" value for two-value effects (swaps and number counters); `content`
   * is the "from". Numeric effects parse both with Number(). Unused otherwise.
   */
  contentTo?: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  textEffect?: TextEffect;
  textEffectSpeed?: number;
  /** Word/phrase to highlight — used by inline-highlight and marker-highlight effects */
  textEffectHighlight?: string;
  /** Cursor blinks per second — used by the typewriter effect only */
  textEffectCursorBlinkSpeed?: number;
};

export type ImageElement = BaseElement & {
  type: 'image';
  assetId: string;
  objectFit?: 'cover' | 'contain';
};

export type VideoElement = BaseElement & {
  type: 'video';
  assetId: string;
  objectFit?: 'cover' | 'contain';
};

export type AudioElement = BaseElement & {
  type: 'audio';
  assetId: string;
  volume?: number; // 0–1
};

export const SHADER_PRESETS = [
  'shader-mesh-gradient', 'shader-grain-gradient', 'shader-warp', 'shader-swirl',
  'shader-water', 'shader-spiral', 'shader-liquid-metal', 'shader-color-panels',
  'shader-neuro-noise', 'shader-perlin-noise', 'shader-simplex-noise', 'shader-voronoi',
  'shader-dot-orbit', 'shader-dithering', 'shader-god-rays', 'shader-smoke-ring',
  'shader-metaballs', 'shader-pulsing-border',
] as const;

export type ShaderPreset = typeof SHADER_PRESETS[number];

export type ShaderElement = BaseElement & {
  type: 'shader';
  shader: ShaderPreset;
  shaderSpeed?: number;
};

export const BLOCK_PRESETS = [
  'terminal-simulator', 'glass-code-block', 'progress-steps', 'confetti',
] as const;

export type BlockPreset = typeof BLOCK_PRESETS[number];

/** A block's configuration. Values stay flat and primitive on purpose. */
export type BlockProps = Record<string, string | number | boolean>;

/**
 * A structured UI component (terminal window, code block, pipeline, confetti)
 * that text effects can't express because it takes arrays and objects.
 *
 * `blockProps` is deliberately FLAT and JSON-serializable — a project is stored
 * as a JSONB row in Supabase and in localStorage, so anything non-primitive
 * wouldn't survive the round trip. Components wanting arrays-of-objects (a
 * terminal's lines, a pipeline's steps) take a multiline string here and parse
 * it at render time; see `content/blocks/registry.ts`.
 */
export type BlockElement = BaseElement & {
  type: 'block';
  block: BlockPreset;
  blockProps: BlockProps;
};

export type CanvasElement =
  TextElement | ImageElement | VideoElement | AudioElement | ShaderElement | BlockElement;

/* ── Shots ── */

/**
 * A shot: one slice of the video's timeline.
 *
 * Shots are a *labelling* of time, not a container for it. Elements stay in one
 * flat array with absolute `startFrame`s and simply carry a `sceneId`, which is
 * what keeps the entire render path — `MotionComposition`, all three exporters,
 * `audioMix` and the Lambda payload — completely unchanged by their existence.
 * The alternative (nesting elements inside shots, timed relative to them) would
 * have forced every one of those to flatten first.
 *
 * A shot's start is the sum of the durations before it; it is never stored,
 * because two sources for the same number is how they drift apart. Derive it
 * with `sceneOffsets()` in `scenes.ts`.
 *
 * Called "Scene" in code and **"shot"** in the UI. The code name predates the
 * copy and matches `sceneId` on the element.
 */
export interface Scene {
  id: string;
  durationInFrames: number;
  /** User-set. Falls back to "Shot N" by position, so it is never stale. */
  name?: string;
  /** How this shot arrives. A cut belongs to the shot that follows it, which
      is how editors think about it and leaves the first shot with none. */
  transition?: TransitionId;
}

/* ── Project ── */

export interface Project {
  id: string;
  /**
   * Which shape this project is in. Absent means "written before versioning",
   * which `migrateProject` treats as 0.
   *
   * On the project rather than the store envelope, because it has to survive
   * the round trip through Supabase — `engines/project/migrations.ts` explains
   * why that matters.
   */
  schemaVersion?: number;
  name: string;
  aspectRatio: AspectRatio;
  fps: number;
  /** Always equals the sum of `scenes[].durationInFrames`. */
  durationInFrames: number;
  createdAt: number;
  updatedAt: number;
  assets: Asset[];
  /** Ordered, never empty. Optional only for projects saved before shots
      existed — `ensureScenes()` fills it before anything reads it. */
  scenes?: Scene[];
  /** Absent until a track has been analysed or a tempo entered by hand. */
  beatGrid?: BeatGrid;
  canvas: {
    elements: CanvasElement[];
  };
}

export type CreateProjectInput = Pick<Project, 'name' | 'aspectRatio' | 'fps'> & {
  /** Seeded by a template; a blank project starts with none. */
  elements?: CanvasElement[];
  /** Template-defined length. Falls back to DEFAULT_DURATION_SECONDS × fps. */
  durationInFrames?: number;
};
