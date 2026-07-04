import { useProjectStore } from '../project/store';
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

    const element: CanvasElement = {
      id:         crypto.randomUUID(),
      type:       'text',
      x:          input.x          ?? 100,
      y:          input.y          ?? 100,
      width:      input.width      ?? 200,
      height:     input.height     ?? 50,
      rotation:   0,
      opacity:    1,
      zIndex:     elements.length,
      content:    input.content    ?? 'Text',
      fontSize:   input.fontSize   ?? 32,
      fontFamily: input.fontFamily ?? 'Inter, sans-serif',
      color:      input.color      ?? '#ffffff',
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
