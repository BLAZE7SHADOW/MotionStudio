import { Suspense } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { ShaderElement } from '../../../project/types';
import { imageElementStyle } from '../../style';
import { Shaders } from '../../shaders';

/**
 * Renders a full-bleed WebGL shader background. Every Remocn shader wrapper is
 * `position: absolute; inset: 0` internally and self-sizes to `useVideoConfig()`
 * with `fit="cover"` — so it always fills whatever box `imageElementStyle` gives
 * it here, regardless of the element's width/height.
 *
 * The preset → lazy component map lives in `engines/rendering/shaders.ts`: the
 * Properties panel's preview thumbnail needs the same map, and a component file
 * that also exports a registry is one Fast Refresh cannot reload.
 */
export default function ShaderRenderer({ el }: { el: ShaderElement }) {
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ShaderComponent = Shaders[el.shader];

  return (
    <div style={{ ...imageElementStyle(el, 1, { localFrame, fps }), overflow: 'hidden' }}>
      <Suspense fallback={null}>
        <ShaderComponent speed={el.shaderSpeed ?? 1} />
      </Suspense>
    </div>
  );
}
