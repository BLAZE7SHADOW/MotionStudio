import { Suspense } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { BlockElement } from '../../../project/types';
import { imageElementStyle } from '../../style';
import { getBlock } from '@/content/blocks/registry';

/**
 * Renders a structured UI block (terminal, code panel, pipeline, confetti).
 * The registry owns both the lazy import and the translation from the flat,
 * JSON-safe `blockProps` into the component's real props — so this stays a
 * thin dispatcher and adding a block is a registry entry, not a code change.
 */
export default function BlockRenderer({ el }: { el: BlockElement }) {
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const def = getBlock(el.block);
  if (!def) return null;

  const Component = def.component;
  const props = def.toProps({ ...def.defaults, ...el.blockProps });

  return (
    <div style={{ ...imageElementStyle(el, 1, { localFrame, fps }), overflow: 'hidden' }}>
      <Suspense fallback={null}>
        <Component {...props} />
      </Suspense>
    </div>
  );
}
