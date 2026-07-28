import { useProjectStore } from '../project/store';
import { getCompositionDimensions } from '../project/dimensions';
import { sceneAtFrame, scenesOf } from '../project/scenes';
import type { CanvasElement, TextElement, ImageElement, VideoElement, AudioElement, ShaderElement, ShaderPreset, BlockElement, BlockPreset } from './types';
import type { AddTextInput } from './types';
import { getBlock } from '@/content/blocks/registry';

/**
 * A patch for any element. Because CanvasElement is a union, `Omit<union, K>`
 * would collapse to only the *common* fields — so we intersect the per-member
 * partials, giving one type where every field of every member is optional.
 */
export type ElementPatch =
  Partial<Omit<TextElement, 'id' | 'type'>> &
  Partial<Omit<ImageElement, 'id' | 'type'>> &
  Partial<Omit<VideoElement, 'id' | 'type'>> &
  Partial<Omit<AudioElement, 'id' | 'type'>> &
  Partial<Omit<ShaderElement, 'id' | 'type'>> &
  Partial<Omit<BlockElement, 'id' | 'type'>>;

export function useCanvasEngine() {
  const project       = useProjectStore((s) =>
    s.projects.find((p) => p.id === s.activeProjectId) ?? null
  );
  const updateProject = useProjectStore((s) => s.updateProject);
  const elements = project?.canvas.elements ?? [];

  /* Every new element is stamped with the shot covering its start frame.
     Doing it here rather than letting `ensureScenes` adopt orphans on the next
     load means an element is never briefly shot-less — which would make it
     invisible to a shot-scoped timeline in the session that created it. */
  const inShot = <T extends CanvasElement>(el: T): T =>
    ({ ...el, sceneId: sceneAtFrame(scenesOf(project!), el.startFrame) });

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
      canvas: { elements: [...elements, inShot(element)] },
    });

    return element;
  }

  function addImage(assetId: string, at?: { x: number; y: number }): CanvasElement | null {
    if (!project) return null;
    const asset = project.assets.find((a) => a.id === assetId);
    if (!asset || asset.type !== 'image') return null;
   // aspect ratio preserving fit (also called contain)
    /* fit the image within ~60% of the composition, preserving aspect ratio */

/**
 * Scale the image to fit inside 60% of the composition while preserving
 * its original aspect ratio (no stretching or cropping).
 *
 * Steps:
 * 1. Get the composition (canvas) dimensions.
 * 2. Get the image's natural width and height.
 * 3. Calculate the maximum allowed size (60% of canvas).
 * 4. Compute the width and height scale factors.
 * 5. Pick the smaller scale so both dimensions fit.
 * 6. Apply the same scale to width and height to preserve aspect ratio.
 */

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
      x:                at ? Math.round(at.x - w / 2) : Math.round((compW - w) / 2),
      y:                at ? Math.round(at.y - h / 2) : Math.round((compH - h) / 2),
      width:            w,
      height:           h,
      rotation:         0,
      opacity:          1,
      zIndex:           elements.length,
      startFrame:       0,
      durationInFrames: project.durationInFrames,
      objectFit:        'cover',
    };

    updateProject(project.id, { canvas: { elements: [...elements, inShot(element)] } });
    return element;
  }

  function addVideo(assetId: string, at?: { x: number; y: number }): CanvasElement | null {
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
      x:                at ? Math.round(at.x - w / 2) : Math.round((compW - w) / 2),
      y:                at ? Math.round(at.y - h / 2) : Math.round((compH - h) / 2),
      width:            w,
      height:           h,
      rotation:         0,
      opacity:          1,
      zIndex:           elements.length,
      startFrame:       0,
      durationInFrames,
      objectFit:        'cover',
    };

    updateProject(project.id, { canvas: { elements: [...elements, inShot(element)] } });
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

    updateProject(project.id, { canvas: { elements: [...elements, inShot(element)] } });
    return element;
  }

  /**
   * Add a full-bleed shader background, automatically sent behind every
   * existing element. zIndex must stay >= 0 — Remotion's Player renders a
   * solid backdrop that any negative-zIndex element ends up behind, invisibly
   * (its own DOM stacking, not ours). Every other element shifts forward by
   * one and the new shader takes slot 0 — the same contiguous, non-negative
   * scheme `reorderLayer('back')` already uses.
   */
  function addShader(preset: ShaderPreset): CanvasElement | null {
    if (!project) return null;
    const { width: compW, height: compH } = getCompositionDimensions(project.aspectRatio);
    const shifted = elements.map((el) => ({ ...el, zIndex: el.zIndex + 1 }));

    const element: ShaderElement = {
      id:               crypto.randomUUID(),
      type:             'shader',
      shader:           preset,
      x: 0, y: 0, width: compW, height: compH,
      rotation:         0,
      opacity:          1,
      zIndex:           0,
      startFrame:       0,
      durationInFrames: project.durationInFrames,
    };

    updateProject(project.id, { canvas: { elements: [...shifted, inShot(element)] } });
    return element;
  }

  /**
   * Add a structured UI block (terminal, code panel, pipeline, confetti),
   * centered and sized from the registry's defaults.
   *
   * The clip is at least the block's natural length — a shorter Sequence would
   * cut the animation off mid-way, which is the most common way these
   * components get misused.
   */
  function addBlock(preset: BlockPreset): CanvasElement | null {
    if (!project) return null;
    const def = getBlock(preset);
    const { width: compW, height: compH } = getCompositionDimensions(project.aspectRatio);
    const w = Math.min(def.defaultSize.width, compW);
    const h = Math.min(def.defaultSize.height, compH);

    const element: BlockElement = {
      id:               crypto.randomUUID(),
      type:             'block',
      block:            preset,
      blockProps:       { ...def.defaults },
      x:                Math.round((compW - w) / 2),
      y:                Math.round((compH - h) / 2),
      width:            w,
      height:           h,
      rotation:         0,
      opacity:          1,
      zIndex:           elements.length,
      startFrame:       0,
      durationInFrames: Math.max(def.naturalLength, project.durationInFrames),
    };

    updateProject(project.id, { canvas: { elements: [...elements, inShot(element)] } });
    return element;
  }

  /**
   * Resize + reposition an existing element to fill the canvas and send it
   * behind every other layer — same non-negative zIndex scheme as addShader.
   */
  function makeBackground(id: string) {
    if (!project) return;
    const { width, height } = getCompositionDimensions(project.aspectRatio);
    const next = elements.map((el) =>
      el.id === id
        ? { ...el, x: 0, y: 0, width, height, rotation: 0, zIndex: 0 }
        : { ...el, zIndex: el.zIndex + 1 }
    );
    updateProject(project.id, { canvas: { elements: next } });
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

  /**
   * Restack an element by rewriting zIndex. Stacking is driven by zIndex
   * (ascending = back → front), so we sort by it, move the target within that
   * order, then reassign contiguous zIndex to everyone.
   */
  function reorderLayer(id: string, direction: 'front' | 'back' | 'forward' | 'backward') {
    if (!project) return;
    const stack = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    const i = stack.findIndex((el) => el.id === id);
    if (i === -1) return;

    let j = i;
    if (direction === 'forward')  j = Math.min(stack.length - 1, i + 1);
    if (direction === 'backward') j = Math.max(0, i - 1);
    if (direction === 'front')    j = stack.length - 1;
    if (direction === 'back')     j = 0;
    if (j === i) return; // already at the edge

    const [moved] = stack.splice(i, 1);
    stack.splice(j, 0, moved);

    const orderById = new Map(stack.map((el, idx) => [el.id, idx]));
    const next = elements.map((el) => ({ ...el, zIndex: orderById.get(el.id) ?? el.zIndex }));
    updateProject(project.id, { canvas: { elements: next } });
  }

  return { elements, addText, addImage, addVideo, addAudio, addShader, addBlock, makeBackground, updateElement, removeElement, reorderLayer };
}
