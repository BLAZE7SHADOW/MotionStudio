import type { Project } from '@/engines/project';
import { TooltipProvider } from '@/components/ui/tooltip';
import Toolbar from './Toolbar';
import AssetsPanel from './AssetsPanel';
import CanvasPanel from './CanvasPanel';
import PropertiesPanel from './PropertiesPanel';
import TimelinePanel from './TimelinePanel';
import { useUndoRedoShortcuts } from '../hooks/useUndoRedoShortcuts';
import { useEditorTour } from '../tour/useEditorTour';
import { useHelperLayer } from '../hooks/useHelperLayer';
import HelperCard from '../tour/HelperCard';
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
  // the on-demand explanation that appears while hovering an explainable
  // control, unless turned off — see hooks/useHelperLayer.ts
  const helper = useHelperLayer();
  // one editor per project across tabs — see lib/projectLock.ts
  const lock = useProjectLock(project.id);

  return (
    <TooltipProvider>
    <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-studio-bg">
      {/* The editor has no other heading anywhere — every panel title
          ("Assets", "Properties", "Timeline") is a styled `<span>`, not an
          `<h*>`, and the whole page previously had zero landmarks. A screen
          reader user landing here had no page title to announce and no way
          to jump between regions except tabbing through every control in
          DOM order. Visually hidden because the toolbar's own wordmark
          already does this job for sighted users. */}
      <h1 className="sr-only">{project.name} — MotionStudio editor</h1>
      <a
        href="#editor-canvas"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:px-3 focus:py-2 focus:rounded-studio-md focus:bg-studio-accent focus:text-white focus:text-[13px] focus:font-medium"
      >
        Skip to canvas
      </a>

      <header>
        <Toolbar project={project} />
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Assets — left panel */}
        <aside
          aria-label="Assets"
          data-tour="assets"
          className="w-[220px] shrink-0 border-r border-studio-border overflow-hidden"
        >
          <AssetsPanel />
        </aside>

        {/* Canvas — center. The skip link's target: not otherwise focusable,
            since nothing before it in a fresh page load has typically been
            interacted with, so this is the first purposeful jump a keyboard
            user makes. */}
        <main
          id="editor-canvas"
          tabIndex={-1}
          aria-label="Canvas"
          data-tour="canvas"
          className="flex-1 flex overflow-hidden outline-none"
        >
          <CanvasPanel project={project} />
        </main>

        {/* Properties — right panel */}
        <aside
          aria-label="Properties"
          data-tour="properties"
          className="w-[260px] shrink-0 border-l border-studio-border overflow-hidden"
        >
          <PropertiesPanel />
        </aside>
      </div>

      {/* Timeline — bottom */}
      <section
        aria-label="Timeline"
        data-tour="timeline"
        className="h-56 shrink-0 border-t border-studio-border overflow-hidden"
      >
        <TimelinePanel project={project} />
      </section>

      <ProjectLockGate
        status={lock.status}
        onTakeOver={lock.takeOver}
        onOpenReadOnly={lock.openReadOnly}
      />

      {helper.open && (
        <HelperCard
          target={helper.open.target}
          pointer={helper.open.pointer}
          entry={helper.open.entry}
          onMouseEnter={helper.onCardMouseEnter}
          onMouseLeave={helper.onCardMouseLeave}
        />
      )}
    </div>
    </TooltipProvider>
  );
}
