import { Save, Undo2, Redo2, Download, Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Project } from '@/engines/project';
import ProjectSettingsPopover from './ProjectSettingsPopover';

interface ToolbarProps {
  project: Project;
}

export default function Toolbar({ project }: ToolbarProps) {
  return (
    <div className="h-11 border-b border-studio-border bg-studio-panel flex items-center px-3 gap-0.5 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-1.5 mr-2">
        <div className="w-5 h-5 rounded-[4px] bg-studio-accent flex items-center justify-center">
          <Clapperboard className="w-3 h-3 text-white" />
        </div>
        <span className="text-[13px] font-semibold text-studio-text">MotionStudio</span>
      </div>

      <Separator orientation="vertical" className="h-4 bg-studio-border-strong mx-1.5" />

      {/* File actions */}
      <Button
        variant="ghost"
        size="icon"
        title="Save"
        className="w-8 h-8 text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm"
      >
        <Save className="w-[15px] h-[15px]" />
      </Button>

      <Separator orientation="vertical" className="h-4 bg-studio-border-strong mx-1.5" />

      {/* History */}
      <Button
        variant="ghost"
        size="icon"
        title="Undo"
        className="w-8 h-8 text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm"
      >
        <Undo2 className="w-[15px] h-[15px]" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Redo"
        className="w-8 h-8 text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm"
      >
        <Redo2 className="w-[15px] h-[15px]" />
      </Button>

      <Separator orientation="vertical" className="h-4 bg-studio-border-strong mx-1.5" />

      {/* Project settings — live aspect ratio + fps indicator */}
      <ProjectSettingsPopover project={project} />

      {/* Right side */}
      <div className="ml-auto">
        <Button
          size="sm"
          title="Export"
          className="h-7 px-3 text-[12px] font-medium bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </div>
    </div>
  );
}
