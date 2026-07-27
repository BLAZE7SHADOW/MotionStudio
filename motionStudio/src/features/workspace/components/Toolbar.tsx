import { useNavigate } from 'react-router-dom';
import { Undo2, Redo2, Clapperboard, Type, Sparkles, Play, Pause, SquareTerminal, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TooltipProvider, TooltipHint } from '@/components/ui/tooltip';
import { BLOCK_PRESETS } from '@/engines/project';
import { getBlock } from '@/content/blocks/registry';
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
  const navigate = useNavigate();
  const { addText, addShader, addBlock } = useCanvasEngine();
  const isPlaying     = useEditorStore((s) => s.isPlaying);
  const setIsPlaying  = useEditorStore((s) => s.setIsPlaying);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const undo    = useProjectStore((s) => s.undo);
  const redo    = useProjectStore((s) => s.redo);
  const canUndo = useProjectStore((s) => s.past.length > 0);
  const canRedo = useProjectStore((s) => s.future.length > 0);

  return (
    <TooltipProvider>
    <div className="h-11 border-b border-studio-border bg-studio-panel flex items-center px-3 gap-0.5 shrink-0">
      {/* One way back, not two — this and the logo were separate controls
          doing the identical thing, side by side. The logo carries the arrow
          now. Edits are already autosaved (2 s debounce + localStorage), so
          leaving mid-edit is safe. */}
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        title="Back to projects"
        className="group flex items-center gap-2 pl-1.5 pr-2.5 py-1 mr-2 rounded-studio-sm hover:bg-studio-surface transition-colors duration-[120ms] cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-studio-text-faint group-hover:text-studio-text transition-colors" />
        <div className="w-5 h-5 rounded-[4px] bg-studio-accent flex items-center justify-center">
          <Clapperboard className="w-3 h-3 text-white" />
        </div>
        <span className="text-[13px] font-semibold text-studio-text">MotionStudio</span>
      </button>

      <Separator orientation="vertical" className="h-4 bg-studio-border-strong mx-1.5" />

      {/* History */}
      <TooltipHint label="Undo" shortcut="⌘Z">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { track.editorUndo(); undo(); }}
          disabled={!canUndo}
          className="w-8 h-8 text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm disabled:opacity-30 disabled:pointer-events-none"
        >
          <Undo2 className="w-[15px] h-[15px]" />
        </Button>
      </TooltipHint>
      <TooltipHint label="Redo" shortcut="⌘⇧Z">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { track.editorRedo(); redo(); }}
          disabled={!canRedo}
          className="w-8 h-8 text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm disabled:opacity-30 disabled:pointer-events-none"
        >
          <Redo2 className="w-[15px] h-[15px]" />
        </Button>
      </TooltipHint>

      <Separator orientation="vertical" className="h-4 bg-studio-border-strong mx-1.5" />

      {/* Insert tools */}
      <span data-tour="insert" className="flex items-center gap-0.5">
      <TooltipHint label="Add text">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { track.editorTextAdded(); const el = addText(); if (el) setSelectedElement(el.id); }}
          className="w-8 h-8 text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm"
        >
          <Type className="w-3.75 h-3.75" />
        </Button>
      </TooltipHint>
      <TooltipHint label="Add animated background">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            track.editorShaderAdded({ shader: 'shader-mesh-gradient' });
            const el = addShader('shader-mesh-gradient');
            if (el) setSelectedElement(el.id);
          }}
          className="w-8 h-8 text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm"
        >
          <Sparkles className="w-3.75 h-3.75" />
        </Button>
      </TooltipHint>

      {/* Structured blocks — terminal, code, pipeline, confetti */}
      <Popover>
        <PopoverTrigger asChild>
          <TooltipHint label="Add a block — terminal, code, steps, confetti">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-sm"
            >
              <SquareTerminal className="w-3.75 h-3.75" />
            </Button>
          </TooltipHint>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-56 p-1.5 bg-studio-panel border-studio-border-strong rounded-studio-lg"
        >
          {BLOCK_PRESETS.map((preset) => {
            const def = getBlock(preset);
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  track.editorBlockAdded({ block: preset });
                  const el = addBlock(preset);
                  if (el) setSelectedElement(el.id);
                }}
                className="w-full text-left px-2.5 py-2 rounded-studio-md hover:bg-studio-surface transition-colors duration-[120ms]"
              >
                <span className="block text-[12px] font-medium text-studio-text">{def.label}</span>
                <span className="block text-[10px] text-studio-text-faint leading-snug mt-0.5">
                  {def.description}
                </span>
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
      </span>

      <Separator orientation="vertical" className="h-4 bg-studio-border-strong mx-1.5" />

      {/* Project settings — live aspect ratio + fps indicator */}
      <ProjectSettingsPopover project={project} />

      {/* Preview toggle */}
      <div className="ml-auto flex items-center gap-2">
        <Button
          data-tour="preview"
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

        <span data-tour="export"><ExportDialog project={project} /></span>

        <Separator orientation="vertical" className="h-4 bg-studio-border-strong" />

        <UserMenu />
      </div>
    </div>
    </TooltipProvider>
  );
}
