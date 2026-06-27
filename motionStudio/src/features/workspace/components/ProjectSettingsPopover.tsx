import { useState, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjectStore } from '@/engines/project';
import type { Project, AspectRatio } from '@/engines/project';

interface ProjectSettingsPopoverProps {
  project: Project;
}

const ASPECT_OPTIONS: { value: AspectRatio; label: string; sub: string }[] = [
  { value: '16:9', label: '16:9', sub: 'Landscape' },
  { value: '9:16', label: '9:16', sub: 'Portrait' },
  { value: '1:1',  label: '1:1',  sub: 'Square' },
];

const FPS_OPTIONS = [24, 30, 60] as const;

export default function ProjectSettingsPopover({ project }: ProjectSettingsPopoverProps) {
  const updateProject = useProjectStore((s) => s.updateProject);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.aspectRatio);
  const [fps, setFps] = useState(project.fps);

  useEffect(() => {
    setAspectRatio(project.aspectRatio);
    setFps(project.fps);
  }, [project.id, project.aspectRatio, project.fps]);

  function handleAspectRatioChange(value: AspectRatio) {
    setAspectRatio(value);
    updateProject(project.id, { aspectRatio: value });
  }

  function handleFpsChange(value: number) {
    setFps(value);
    updateProject(project.id, { fps: value });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-studio-sm text-[12px] font-medium text-studio-text-muted hover:text-studio-text hover:bg-studio-surface transition-colors duration-120 border border-transparent hover:border-studio-border"
        >
          <span className="font-mono">{project.aspectRatio}</span>
          <span className="text-studio-text-faint">·</span>
          <span className="font-mono">{project.fps} fps</span>
          <Settings2 className="w-3 h-3 ml-0.5 text-studio-text-faint" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-64 p-0 bg-studio-panel border-studio-border-strong rounded-studio-lg shadow-studio-md"
      >
        <div className="px-4 py-3 border-b border-studio-border">
          <p className="text-[12px] font-semibold text-studio-text-faint uppercase tracking-wider">
            Project Settings
          </p>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4">
          {/* Aspect Ratio */}
          <div className="flex flex-col gap-2">
            <Label className="text-[11px] font-medium text-studio-text-muted uppercase tracking-wider">
              Aspect Ratio
            </Label>
            <Select
              value={aspectRatio}
              onValueChange={(v) => handleAspectRatioChange(v as AspectRatio)}
            >
              <SelectTrigger className="h-8 text-[13px] bg-studio-surface border-studio-border text-studio-text rounded-studio-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-studio-panel border-studio-border-strong rounded-studio-lg">
                {ASPECT_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-[13px] text-studio-text focus:bg-studio-surface [&>span:last-of-type]:flex-1"
                  >
                    <span className="font-medium w-10 shrink-0">{opt.label}</span>
                    <span className="text-[11px] text-studio-text-faint">{opt.sub}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* FPS */}
          <div className="flex flex-col gap-2">
            <Label className="text-[11px] font-medium text-studio-text-muted uppercase tracking-wider">
              Frame Rate
            </Label>
            <div className="flex gap-1.5">
              {FPS_OPTIONS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFpsChange(f)}
                  className={[
                    'flex-1 h-8 text-[12px] font-medium rounded-studio-md border transition-colors duration-120',
                    fps === f
                      ? 'bg-studio-accent-subtle border-studio-accent-border text-studio-accent'
                      : 'bg-studio-surface border-studio-border text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong',
                  ].join(' ')}
                >
                  {f}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-studio-text-faint">fps</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
