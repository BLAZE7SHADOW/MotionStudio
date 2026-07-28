import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/engines/project';
import { useEditorStore } from '@/engines/editor';
import { rehydrateAssets } from '@/engines/asset';
import DesktopOnlyGate from '@/components/DesktopOnlyGate';
import EditorLayout from './components/EditorLayout';

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const project           = useProjectStore((s) => s.getProject(projectId ?? ''));
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);
  const reset             = useEditorStore((s) => s.reset);

  /* `reset()` clears the editor's session state, which includes which shot is
     open — correct, since carrying shot 3 into a project that has one shot
     would be nonsense. But it also means the opening shot has to be chosen
     *here*, right after the reset: child effects run before parent effects, so
     anything the timeline decided on mount would be wiped a moment later.

     `projectReady` is in the deps so this runs again once the project arrives
     from IndexedDB. It's a boolean, so it settles after that one flip and
     can't re-fire on every edit — which would reset the editor mid-keystroke. */
  const projectReady = !!project;
  useEffect(() => {
    setActiveProjectId(projectId ?? null);
    reset();
    const first = useProjectStore.getState().getProject(projectId ?? '')?.scenes?.[0];
    if (first) useEditorStore.getState().setActiveScene(first.id);
    if (projectId) void rehydrateAssets(projectId); // relink media from IndexedDB
    return () => setActiveProjectId(null);
  }, [projectId, projectReady, setActiveProjectId, reset]);

  return (
    <DesktopOnlyGate
      title="The editor needs a bigger screen"
      description="Precise timeline, canvas, and layer editing require a laptop or desktop display — it isn't built for touchscreens or small viewports."
    >
      {project ? (
        <EditorLayout project={project} />
      ) : (
        <div className="h-screen flex flex-col items-center justify-center gap-3 bg-studio-bg">
          <p className="text-[13px] text-studio-text-muted">Project not found.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-[13px] text-studio-accent hover:text-studio-accent-hover underline underline-offset-2 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      )}
    </DesktopOnlyGate>
  );
}
