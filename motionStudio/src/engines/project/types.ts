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
  /* temporal — Remotion <Sequence> model */
  startFrame: number;
  durationInFrames: number;
  /* motion — evaluated per frame relative to the clip start */
  animations?: Animation[];
};

export type TextElement = BaseElement & {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
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

export type CanvasElement = TextElement | ImageElement | VideoElement | AudioElement;

/* ── Project ── */

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  fps: number;
  durationInFrames: number;
  createdAt: number;
  updatedAt: number;
  assets: Asset[];
  canvas: {
    elements: CanvasElement[];
  };
}

export type CreateProjectInput = Pick<Project, 'name' | 'aspectRatio' | 'fps'>;
