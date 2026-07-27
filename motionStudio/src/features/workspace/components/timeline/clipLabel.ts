import type { CanvasElement } from '@/engines/project';
import { getBlock } from '@/content/blocks/registry';

/**
 * The human name for a clip, shared by the track header and the clip itself.
 *
 * These had drifted apart: the clip resolved a block to its registry label
 * ("Terminal") while the header printed the raw discriminant ("block"), so the
 * same element read as two different things a few pixels apart.
 */
export function clipLabel(el: CanvasElement): string {
  if (el.type === 'text') return el.content.trim() || 'Text';
  if (el.type === 'block') return getBlock(el.block).label;
  return el.type.charAt(0).toUpperCase() + el.type.slice(1);
}
