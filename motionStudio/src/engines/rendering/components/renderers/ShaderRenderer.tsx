import { lazy, Suspense } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { ShaderElement, ShaderPreset } from '../../../project/types';
import { imageElementStyle } from '../../style';

/**
 * One source of truth for the shader chunks.
 *
 * Each shader is its own lazily-loaded bundle, so the first preview that uses a
 * given shader pays for fetching and compiling it — which is why some template
 * previews appear instantly and others visibly lag. `prefetchShaders` below
 * lets a caller warm them ahead of time; deriving both the lazy components and
 * the prefetcher from this map means a newly added shader can't be wired into
 * one and forgotten by the other.
 */
const shaderImports = {
  'shader-mesh-gradient':  () => import('@/components/remocn/shader-mesh-gradient').then(m => ({ default: m.ShaderMeshGradient })),
  'shader-grain-gradient': () => import('@/components/remocn/shader-grain-gradient').then(m => ({ default: m.ShaderGrainGradient })),
  'shader-warp':           () => import('@/components/remocn/shader-warp').then(m => ({ default: m.ShaderWarp })),
  'shader-swirl':          () => import('@/components/remocn/shader-swirl').then(m => ({ default: m.ShaderSwirl })),
  'shader-water':          () => import('@/components/remocn/shader-water').then(m => ({ default: m.ShaderWater })),
  'shader-spiral':         () => import('@/components/remocn/shader-spiral').then(m => ({ default: m.ShaderSpiral })),
  'shader-liquid-metal':   () => import('@/components/remocn/shader-liquid-metal').then(m => ({ default: m.ShaderLiquidMetal })),
  'shader-color-panels':   () => import('@/components/remocn/shader-color-panels').then(m => ({ default: m.ShaderColorPanels })),
  'shader-neuro-noise':    () => import('@/components/remocn/shader-neuro-noise').then(m => ({ default: m.ShaderNeuroNoise })),
  'shader-perlin-noise':   () => import('@/components/remocn/shader-perlin-noise').then(m => ({ default: m.ShaderPerlinNoise })),
  'shader-simplex-noise':  () => import('@/components/remocn/shader-simplex-noise').then(m => ({ default: m.ShaderSimplexNoise })),
  'shader-voronoi':        () => import('@/components/remocn/shader-voronoi').then(m => ({ default: m.ShaderVoronoi })),
  'shader-dot-orbit':      () => import('@/components/remocn/shader-dot-orbit').then(m => ({ default: m.ShaderDotOrbit })),
  'shader-dithering':      () => import('@/components/remocn/shader-dithering').then(m => ({ default: m.ShaderDithering })),
  'shader-god-rays':       () => import('@/components/remocn/shader-god-rays').then(m => ({ default: m.ShaderGodRays })),
  'shader-smoke-ring':     () => import('@/components/remocn/shader-smoke-ring').then(m => ({ default: m.ShaderSmokeRing })),
  'shader-metaballs':      () => import('@/components/remocn/shader-metaballs').then(m => ({ default: m.ShaderMetaballs })),
  'shader-pulsing-border': () => import('@/components/remocn/shader-pulsing-border').then(m => ({ default: m.ShaderPulsingBorder })),
} satisfies Record<ShaderPreset, () => Promise<{ default: React.ComponentType<{ speed?: number }> }>>;

/** Exported so the Properties-panel preview can reuse the same components. */
export const Shaders = Object.fromEntries(
  Object.entries(shaderImports).map(([key, loader]) => [key, lazy(loader)]),
) as Record<ShaderPreset, React.LazyExoticComponent<React.ComponentType<{ speed?: number }>>>;

/**
 * Warm shader chunks so a later preview doesn't wait on the network.
 *
 * Scheduled when the browser is idle: this is speculative work and must never
 * compete with a preview the user is actually looking at. Failures are ignored
 * — a missed prefetch just means the normal lazy load happens later.
 */
export function prefetchShaders(presets: readonly ShaderPreset[]): void {
  const run = () => {
    for (const preset of new Set(presets)) {
      shaderImports[preset]?.().catch(() => {});
    }
  };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 2000 });
  else setTimeout(run, 200);
}

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
