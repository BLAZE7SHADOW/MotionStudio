import { useProjectStore } from '../project/store';
import { getCompositionDimensions } from '../project/dimensions';
import type { CanvasElement } from './types';
import type { AddTextInput } from './types';

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

  function updateElement(id: string, updates: Partial<Omit<CanvasElement, 'id' | 'type'>>) {
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

  return { elements, addText, updateElement, removeElement, reorderElement };
}
