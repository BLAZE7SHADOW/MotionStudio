import { useProjectStore } from '../project/store';
import { getCompositionDimensions } from '../project/dimensions';
import type { CanvasElement, TextElement, ImageElement, VideoElement, AudioElement } from './types';
import type { AddTextInput } from './types';

/**
 * A patch for any element. Because CanvasElement is a union, `Omit<union, K>`
 * would collapse to only the *common* fields — so we intersect the per-member
 * partials, giving one type where every field of every member is optional.
 */
export type ElementPatch =
  Partial<Omit<TextElement, 'id' | 'type'>> &
  Partial<Omit<ImageElement, 'id' | 'type'>> &
  Partial<Omit<VideoElement, 'id' | 'type'>> &
  Partial<Omit<AudioElement, 'id' | 'type'>>;

export function useCanvasEngine() {
  const project       = useProjectStore((s) =>
    s.projects.find((p) => p.id === s.activeProjectId) ?? null
  );
  const updateProject = useProjectStore((s) => s.updateProject);
  const elements = project?.canvas.elements ?? [];

  function addText(input: AddTextInput = {}): CanvasElement | null {
    if (!project) return null;

    /* default: a centered text box in composition space */
    const { width: compW, height: compH } = getCompositionDimensions(project.aspectRatio);
    const w = input.width  ?? 1000;
    const h = input.height ?? 160;

    const element: CanvasElement = {
      id:               crypto.randomUUID(),
      type:             'text',
      x:                input.x ?? Math.round((compW - w) / 2),
      y:                input.y ?? Math.round((compH - h) / 2),
      width:            w,
      height:           h,
      rotation:         0,
      opacity:          1,
      zIndex:           elements.length,
      startFrame:       0,
      durationInFrames: project.durationInFrames,
      content:          input.content    ?? 'Text',
      fontSize:         input.fontSize   ?? 96,
      fontFamily:       input.fontFamily ?? 'Inter, sans-serif',
      color:            input.color      ?? '#ffffff',
    };

    updateProject(project.id, {
      canvas: { elements: [...elements, element] },
    });

    return element;
  }

  function addImage(assetId: string): CanvasElement | null {
    if (!project) return null;
    const asset = project.assets.find((a) => a.id === assetId);
    if (!asset || asset.type !== 'image') return null;

    /* fit the image within ~60% of the composition, preserving aspect ratio */
    const { width: compW, height: compH } = getCompositionDimensions(project.aspectRatio);
    const natW = asset.width  ?? compW;
    const natH = asset.height ?? compH;
    const fit = Math.min((compW * 0.6) / natW, (compH * 0.6) / natH);
    const w = Math.round(natW * fit);
    const h = Math.round(natH * fit);

    const element: ImageElement = {
      id:               crypto.randomUUID(),
      type:             'image',
      assetId,
      x:                Math.round((compW - w) / 2),
      y:                Math.round((compH - h) / 2),
      width:            w,
      height:           h,
      rotation:         0,
      opacity:          1,
      zIndex:           elements.length,
      startFrame:       0,
      durationInFrames: project.durationInFrames,
      objectFit:        'cover',
    };

    updateProject(project.id, { canvas: { elements: [...elements, element] } });
    return element;
  }

  function addVideo(assetId: string): CanvasElement | null {
    if (!project) return null;
    const asset = project.assets.find((a) => a.id === assetId);
    if (!asset || asset.type !== 'video') return null;

    const { width: compW, height: compH } = getCompositionDimensions(project.aspectRatio);
    const natW = asset.width  ?? compW;
    const natH = asset.height ?? compH;
    const fit = Math.min((compW * 0.8) / natW, (compH * 0.8) / natH);
    const w = Math.round(natW * fit);
    const h = Math.round(natH * fit);

    /* the clip can't be longer than the source video */
    const sourceFrames = asset.durationInSeconds
      ? Math.round(asset.durationInSeconds * project.fps)
      : project.durationInFrames;
    const durationInFrames = Math.min(project.durationInFrames, sourceFrames);

    const element: VideoElement = {
      id:               crypto.randomUUID(),
      type:             'video',
      assetId,
      x:                Math.round((compW - w) / 2),
      y:                Math.round((compH - h) / 2),
      width:            w,
      height:           h,
      rotation:         0,
      opacity:          1,
      zIndex:           elements.length,
      startFrame:       0,
      durationInFrames,
      objectFit:        'cover',
    };

    updateProject(project.id, { canvas: { elements: [...elements, element] } });
    return element;
  }

  function addAudio(assetId: string): CanvasElement | null {
    if (!project) return null;
    const asset = project.assets.find((a) => a.id === assetId);
    if (!asset || asset.type !== 'audio') return null;

    const sourceFrames = asset.durationInSeconds
      ? Math.round(asset.durationInSeconds * project.fps)
      : project.durationInFrames;
    const durationInFrames = Math.min(project.durationInFrames, sourceFrames);

    /* audio has no canvas presence — spatial fields are zero */
    const element: AudioElement = {
      id:               crypto.randomUUID(),
      type:             'audio',
      assetId,
      x: 0, y: 0, width: 0, height: 0,
      rotation: 0, opacity: 1,
      zIndex:           elements.length,
      startFrame:       0,
      durationInFrames,
      volume:           1,
    };

    updateProject(project.id, { canvas: { elements: [...elements, element] } });
    return element;
  }

  function updateElement(id: string, updates: ElementPatch) {
    if (!project) return;
    updateProject(project.id, {
      canvas: {
        elements: elements.map((el) =>
          el.id === id ? ({ ...el, ...updates } as CanvasElement) : el
        ),
      },
    });
  }

  function removeElement(id: string) {
    if (!project) return;
    updateProject(project.id, {
      canvas: { elements: elements.filter((el) => el.id !== id) },
    });
  }

  function reorderElement(id: string, direction: 'up' | 'down') {
    if (!project) return;
    const idx = elements.findIndex((el) => el.id === id);
    if (idx === -1) return;
    const next = [...elements];
    if (direction === 'up' && idx < next.length - 1)
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    if (direction === 'down' && idx > 0)
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
    updateProject(project.id, { canvas: { elements: next } });
  }

  return { elements, addText, addImage, addVideo, addAudio, updateElement, removeElement, reorderElement };
}
