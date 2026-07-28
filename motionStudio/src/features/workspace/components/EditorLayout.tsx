import type { Project } from '@/engines/project';
import Toolbar from './Toolbar';
import AssetsPanel from './AssetsPanel';
import CanvasPanel from './CanvasPanel';
import PropertiesPanel from './PropertiesPanel';
import TimelinePanel from './TimelinePanel';
import { useUndoRedoShortcuts } from '../hooks/useUndoRedoShortcuts';
import { useEditorTour } from '../tour/useEditorTour';
import { useProjectLock } from '../hooks/useProjectLock';
import ProjectLockGate from './ProjectLockGate';

interface EditorLayoutProps {
  project: Project;
}

export default function EditorLayout({ project }: EditorLayoutProps) {
  // playback clock: the Remotion Player inside CanvasPanel drives currentFrame
  useUndoRedoShortcuts();
  // first-run walkthrough; no-ops once the user has seen or dismissed it
  useEditorTour(true);
  // one editor per project across tabs — see lib/projectLock.ts
  const lock = useProjectLock(project.id);

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-studio-bg">
      <Toolbar project={project} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Assets — left panel */}
        <div data-tour="assets" className="w-[220px] shrink-0 border-r border-studio-border overflow-hidden">
          <AssetsPanel />
        </div>

        {/* Canvas — center */}
        <div data-tour="canvas" className="flex-1 flex overflow-hidden">
          <CanvasPanel projectId={project.id} />
        </div>

        {/* Properties — right panel */}
        <div data-tour="properties" className="w-[260px] shrink-0 border-l border-studio-border overflow-hidden">
          <PropertiesPanel />
        </div>
      </div>

      {/* Timeline — bottom */}
      <div data-tour="timeline" className="h-56 shrink-0 border-t border-studio-border overflow-hidden">
        <TimelinePanel project={project} />
      </div>

      <ProjectLockGate
        status={lock.status}
        onTakeOver={lock.takeOver}
        onOpenReadOnly={lock.openReadOnly}
      />
    </div>
  );
}
