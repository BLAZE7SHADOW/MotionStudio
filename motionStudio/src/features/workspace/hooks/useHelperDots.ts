import { useEffect } from 'react';
import { useHelperMode } from '@/lib/helperMode';
import { useEditorStore } from '@/engines/editor';
import { useProjectStore } from '@/engines/project';
import { refreshHelperDots, syncHelperDots } from '../tour/helperMode';

/**
 * Keeps the helper dots in step with the editor.
 *
 * Two jobs, deliberately in two effects:
 *
 * 1. **Follow the switch.** Turning the mode on loads driver.js's `hints` entry
 *    point the first time and never again.
 *
 * 2. **Follow the DOM.** Half the things a dot can sit on are conditional —
 *    Sound exists only while a music clip is selected, Effects only while text
 *    is, the transition picker only from the second shot on. Rather than watch
 *    the document with a `MutationObserver`, this re-resolves the anchors when
 *    the handful of pieces of state that *cause* those panels to mount change.
 *    `shape` is a string rather than three deps so a project edit that changes
 *    nothing structural doesn't churn the beacons.
 *
 * Dots are also stood down on the way out: the dashboard has no `data-tour`
 * anchors, and beacons left pointing at unmounted panels would be pinned to
 * wherever those panels used to be.
 */
export function useHelperDots(): void {
  const on = useHelperMode((s) => s.on);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const activeSceneId = useEditorStore((s) => s.activeSceneId);

  const shape = useProjectStore((s) => {
    const project = s.getProject(s.activeProjectId ?? '');
    if (!project) return '';
    return `${project.canvas.elements.length}:${project.assets.length}:${project.scenes?.length ?? 0}`;
  });

  useEffect(() => {
    void syncHelperDots(on);
  }, [on]);

  useEffect(() => {
    refreshHelperDots();
  }, [on, selectedElementId, activeSceneId, shape]);

  useEffect(() => () => void syncHelperDots(false), []);
}
