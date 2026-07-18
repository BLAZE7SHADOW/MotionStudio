import { Undo2, Redo2, Clapperboard, Type, Sparkles, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Project } from '@/engines/project';
import { useProjectStore } from '@/engines/project';
import { useCanvasEngine } from '@/engines/canvas';
import { useEditorStore } from '@/engines/editor';
import ProjectSettingsPopover from './ProjectSettingsPopover';
import ExportDialog from './ExportDialog';
import UserMenu from '@/components/UserMenu';
import { track } from '@/lib/analytics';

interface ToolbarProps {
  project: Project;
}

export default function Toolbar({ project }: ToolbarProps) {
  const { addText, addShader } = useCanvasEngine();
  const isPlaying    = useEditorStore((s) => s.isPlaying);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const undo    = useProjectStore((s) => s.undo);
  const redo    = useProjectStore((s) => s.redo);
  const canUndo = useProjectStore((s) => s.past.length > 0);
  const canRedo = useProjectStore((s) => s.future.length > 0);

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

      {/* History */}
      <Button
        variant="ghost"
        size="icon"
        title="Undo (⌘Z)"
        onClick={() => { track.editorUndo(); undo(); }}
        disabled={!canUndo}
        className="w-8 h-8 text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm disabled:opacity-30 disabled:pointer-events-none"
      >
        <Undo2 className="w-[15px] h-[15px]" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Redo (⌘⇧Z)"
        onClick={() => { track.editorRedo(); redo(); }}
        disabled={!canRedo}
        className="w-8 h-8 text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm disabled:opacity-30 disabled:pointer-events-none"
      >
        <Redo2 className="w-[15px] h-[15px]" />
      </Button>

      <Separator orientation="vertical" className="h-4 bg-studio-border-strong mx-1.5" />

      {/* Insert tools */}
      <Button
        variant="ghost"
        size="icon"
        title="Add Text"
        onClick={() => { track.editorTextAdded(); addText(); }}
        className="w-8 h-8 text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm"
      >
        <Type className="w-3.75 h-3.75" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Add Background"
        onClick={() => { track.editorShaderAdded({ shader: 'shader-mesh-gradient' }); addShader('shader-mesh-gradient'); }}
        className="w-8 h-8 text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm"
      >
        <Sparkles className="w-3.75 h-3.75" />
      </Button>

      <Separator orientation="vertical" className="h-4 bg-studio-border-strong mx-1.5" />

      {/* Project settings — live aspect ratio + fps indicator */}
      <ProjectSettingsPopover project={project} />

      {/* Preview toggle */}
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          title={isPlaying ? 'Stop preview' : 'Play preview'}
          onClick={() => { track.editorPreviewToggled(!isPlaying); setIsPlaying(!isPlaying); }}
          className="h-7 px-3 text-[12px] font-medium text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-md gap-1.5"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlaying ? 'Stop' : 'Preview'}
        </Button>

        <Separator orientation="vertical" className="h-4 bg-studio-border-strong" />

        <ExportDialog project={project} />

        <Separator orientation="vertical" className="h-4 bg-studio-border-strong" />

        <UserMenu />
      </div>
    </div>
  );
}
