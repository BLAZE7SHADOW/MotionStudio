import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import type { ShaderPreset } from '../project/types';

/**
 * Every shader background, lazily imported so each is its own bundle chunk and
 * only downloads when something actually uses it.
 *
 * This lives in its own module rather than beside `ShaderRenderer` because two
 * unrelated callers need it — the renderer, and the Properties panel's live
 * preview thumbnail — and a component file that also exports a registry is a
 * file React Fast Refresh gives up on. That was the last
 * `react-refresh/only-export-components` error in app code; the fix is the
 * structure, not a suppression.
 *
 * `satisfies Record<ShaderPreset, …>` is load-bearing: add a preset to the
 * union and this stops compiling until it is wired up here, so a shader can
 * never ship as an option that renders nothing.
 */
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
} satisfies Record<ShaderPreset, LazyExoticComponent<ComponentType<{ speed?: number }>>>;
