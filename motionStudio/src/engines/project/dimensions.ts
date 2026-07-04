import type { AspectRatio } from './types';

export interface CompositionDimensions {
  width: number;
  height: number;
}

/**
 * Real composition pixel size for an aspect ratio.
 * Elements are positioned in this coordinate space; the editor scales
 * it down to fit the viewport, Remotion renders it at native size.
 */
export function getCompositionDimensions(aspectRatio: AspectRatio): CompositionDimensions {
  switch (aspectRatio) {
    case '16:9': return { width: 1920, height: 1080 };
    case '9:16': return { width: 1080, height: 1920 };
    case '1:1':  return { width: 1080, height: 1080 };
  }
}

/** Default composition length in seconds for a new project. */
export const DEFAULT_DURATION_SECONDS = 5;
