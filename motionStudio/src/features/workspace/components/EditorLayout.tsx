import type { Project } from '@/engines/project';
import Toolbar from './Toolbar';
import AssetsPanel from './AssetsPanel';
import CanvasPanel from './CanvasPanel';
import PropertiesPanel from './PropertiesPanel';
import TimelinePanel from './TimelinePanel';

interface EditorLayoutProps {
  project: Project;
}

export default function EditorLayout({ project }: EditorLayoutProps) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-studio-bg">
      <Toolbar project={project} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Assets — left panel */}
        <div className="w-[220px] shrink-0 border-r border-studio-border overflow-hidden">
          <AssetsPanel />
        </div>

        {/* Canvas — center */}
        <div className="flex-1 flex overflow-hidden">
          <CanvasPanel projectId={project.id} />
        </div>

        {/* Properties — right panel */}
        <div className="w-[260px] shrink-0 border-l border-studio-border overflow-hidden">
          <PropertiesPanel />
        </div>
      </div>

      {/* Timeline — bottom */}
      <div className="h-44 shrink-0 border-t border-studio-border overflow-hidden">
        <TimelinePanel />
      </div>
    </div>
  );
}
