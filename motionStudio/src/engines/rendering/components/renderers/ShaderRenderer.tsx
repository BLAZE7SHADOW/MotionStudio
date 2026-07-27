import { lazy, Suspense } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { ShaderElement, ShaderPreset } from '../../../project/types';
import { imageElementStyle } from '../../style';

// Lazily imported — each shader is its own bundle chunk, only loaded when used.
// Exported so a live preview thumbnail (Properties panel) can reuse the same map.
export const Shaders = {
  'shader-mesh-gradient':  lazy(() => import('@/components/remocn/shader-mesh-gradient').then(m => ({ default: m.ShaderMeshGradient }))),
  'shader-grain-gradient': lazy(() => import('@/components/remocn/shader-grain-gradient').then(m => ({ default: m.ShaderGrainGradient }))),
  'shader-warp':           lazy(() => import('@/components/remocn/shader-warp').then(m => ({ default: m.ShaderWarp }))),
  'shader-swirl':          lazy(() => import('@/components/remocn/shader-swirl').then(m => ({ default: m.ShaderSwirl }))),
  'shader-water':          lazy(() => import('@/components/remocn/shader-water').then(m => ({ default: m.ShaderWater }))),
  'shader-spiral':         lazy(() => import('@/components/remocn/shader-spiral').then(m => ({ default: m.ShaderSpiral }))),
  'shader-liquid-metal':   lazy(() => import('@/components/remocn/shader-liquid-metal').then(m => ({ default: m.ShaderLiquidMetal }))),
  'shader-color-panels':   lazy(() => import('@/components/remocn/shader-color-panels').then(m => ({ default: m.ShaderColorPanels }))),
  'shader-neuro-noise':    lazy(() => import('@/components/remocn/shader-neuro-noise').then(m => ({ default: m.ShaderNeuroNoise }))),
  'shader-perlin-noise':   lazy(() => import('@/components/remocn/shader-perlin-noise').then(m => ({ default: m.ShaderPerlinNoise }))),
  'shader-simplex-noise':  lazy(() => import('@/components/remocn/shader-simplex-noise').then(m => ({ default: m.ShaderSimplexNoise }))),
  'shader-voronoi':        lazy(() => import('@/components/remocn/shader-voronoi').then(m => ({ default: m.ShaderVoronoi }))),
  'shader-dot-orbit':      lazy(() => import('@/components/remocn/shader-dot-orbit').then(m => ({ default: m.ShaderDotOrbit }))),
  'shader-dithering':      lazy(() => import('@/components/remocn/shader-dithering').then(m => ({ default: m.ShaderDithering }))),
  'shader-god-rays':       lazy(() => import('@/components/remocn/shader-god-rays').then(m => ({ default: m.ShaderGodRays }))),
  'shader-smoke-ring':     lazy(() => import('@/components/remocn/shader-smoke-ring').then(m => ({ default: m.ShaderSmokeRing }))),
  'shader-metaballs':      lazy(() => import('@/components/remocn/shader-metaballs').then(m => ({ default: m.ShaderMetaballs }))),
  'shader-pulsing-border': lazy(() => import('@/components/remocn/shader-pulsing-border').then(m => ({ default: m.ShaderPulsingBorder }))),
} satisfies Record<ShaderPreset, React.LazyExoticComponent<React.ComponentType<{ speed?: number }>>>;

/**
 * Renders a full-bleed WebGL shader background. Every Remocn shader wrapper is
 * `position: absolute; inset: 0` internally and self-sizes to `useVideoConfig()`
 * with `fit="cover"` — so it always fills whatever box `imageElementStyle` gives
 * it here, regardless of the element's width/height.
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
