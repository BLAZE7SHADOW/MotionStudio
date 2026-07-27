import MotionComposition from '../rendering/components/MotionComposition';
import { getBlob } from '../asset/blobStore';
import { createObjectUrl, revokeObjectUrl, isUrlUsable } from '../asset/objectUrls';
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

/**
 * Give every asset a URL that is definitely alive right now.
 *
 * A project's stored `url` is a `blob:` minted by whichever session imported
 * the file; those die with the session, so a project reopened later (or synced
 * from another device) carries dead references. The decoder can't recover from
 * one — it just retries the failed fetch forever — so the bytes are re-read
 * from IndexedDB and given a fresh object URL, exactly as `rehydrateAssets`
 * does when opening the editor. S3 is the fallback when the file isn't local.
 */
async function resolveAssetUrls(project: Project) {
  const created: string[] = [];

  const assets = await Promise.all(
    project.assets.map(async (asset) => {
      const blob = await getBlob(asset.id).catch(() => undefined);
      if (blob) {
        const url = createObjectUrl(blob);
        created.push(url);
        return { ...asset, url };
      }
      if (asset.storageUrl) return { ...asset, url: asset.storageUrl };
      return asset;
    }),
  );

  // Fail loudly on a reference we know can't load, rather than letting the
  // decoder spin on it — an unexplained hang is worse than a clear error.
  const used = new Set(
    project.canvas.elements
      .filter((el): el is Extract<typeof el, { assetId: string }> => 'assetId' in el)
      .map((el) => el.assetId),
  );
  // Unusable = blank (rehydrate gave up on it) or a stale blob: we didn't just
  // mint. Better to refuse than to hand back a video quietly missing content.
  const broken = assets.filter((a) => used.has(a.id) && !isUrlUsable(a.url));
  if (broken.length > 0) {
    created.forEach(revokeObjectUrl);
    throw new Error(
      `Media is no longer available on this device: ${broken.map((a) => a.name).join(', ')}. ` +
        `Re-upload it, or use Cloud Render if it finished uploading.`,
    );
  }

  return { assets, revoke: () => created.forEach(revokeObjectUrl) };
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

  const { assets, revoke } = await resolveAssetUrls(project);

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
    // Remotion requires a licence key for web rendering. `free-license` covers
    // individuals and small companies — see https://remotion.dev/license and
    // confirm you qualify; set VITE_REMOTION_LICENSE_KEY if you hold a paid
    // one. This is a licensing claim, so it's config rather than hardcoded.
    licenseKey: import.meta.env.VITE_REMOTION_LICENSE_KEY ?? 'free-license',
    onProgress: ({ progress }) => {
      options.onProgress?.(
        Math.round(progress * project.durationInFrames),
        project.durationInFrames,
      );
    },
  });

  try {
    const blob = await result.getBlob();
    const hasAudio = project.canvas.elements.some((el) => el.type === 'audio');
    return { blob, extension: 'mp4', hasAudio };
  } finally {
    revoke();
  }
}
