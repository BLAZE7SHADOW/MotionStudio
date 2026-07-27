import MotionComposition from '../rendering/components/MotionComposition';
import { getCompositionDimensions } from '../project/dimensions';
import type { Project } from '../project/types';
import type { ExportOptions, ExportResult } from './exporter';

/**
 * Client-side export via Remotion's own web renderer.
 *
 * Unlike `exporter.ts` — which hand-draws each frame onto a 2D canvas and so
 * can only express text, image and video — this runs the REAL
 * `MotionComposition`, the same component the editor preview and Lambda use.
 * That's what lets text effects and other React-rendered content survive an
 * in-browser export.
 *
 * It isn't full parity with Lambda. The web renderer emulates layout and
 * styles onto a canvas and supports a subset, notably NOT `background-clip:
 * text` (shimmer-sweep), 3D transforms (perspective-marquee), blend modes, or
 * `<OffthreadVideo>`. It's also flagged experimental upstream. Treat it as a
 * better-but-imperfect free path; Lambda remains the fidelity guarantee.
 *
 * `@remotion/web-renderer` is imported dynamically: it adds ~180 kB to the
 * bundle, and this is an opt-in path, so it shouldn't be on the critical path
 * for someone who just opened the landing page — the same reason every effect
 * and shader is lazy-loaded.
 */

/** `z-index` isn't honoured by the web renderer — paint order is. */
function sortedForPaintOrder(project: Project) {
  return [...project.canvas.elements].sort((a, b) => a.zIndex - b.zIndex);
}

/** Reports whether this browser can run the web renderer at a given size. */
export async function isWebRenderSupported(
  project: Project,
): Promise<{ canRender: boolean; issues: string[] }> {
  const { width, height } = getCompositionDimensions(project.aspectRatio);
  try {
    const { canRenderMediaOnWeb } = await import('@remotion/web-renderer');
    const result = await canRenderMediaOnWeb({ container: 'mp4', width, height });
    return { canRender: result.canRender, issues: result.issues.map((i) => i.message) };
  } catch (e) {
    return { canRender: false, issues: [(e as Error).message] };
  }
}

export async function exportViaWebRenderer(
  project: Project,
  options: ExportOptions,
): Promise<ExportResult> {
  const { width, height } = getCompositionDimensions(project.aspectRatio);

  const assets = project.assets.map((a) => (a.storageUrl ? { ...a, url: a.storageUrl } : a));

  const inputProps = {
    elements: sortedForPaintOrder(project),
    assets,
    background: '#000000',
  };

  const { renderMediaOnWeb } = await import('@remotion/web-renderer');

  const result = await renderMediaOnWeb({
    composition: {
      id: 'MotionStudio',
      component: MotionComposition,
      width,
      height,
      fps: project.fps,
      durationInFrames: project.durationInFrames,
      // Required whenever the component takes props — inputProps overrides it.
      defaultProps: inputProps,
    },
    inputProps,
    container: 'mp4',
    scale: options.resolutionScale,
    videoBitrate: options.videoBitsPerSecond,
    onProgress: ({ progress }) => {
      options.onProgress?.(
        Math.round(progress * project.durationInFrames),
        project.durationInFrames,
      );
    },
  });

  const blob = await result.getBlob();
  const hasAudio = project.canvas.elements.some((el) => el.type === 'audio');
  return { blob, extension: 'mp4', hasAudio };
}
