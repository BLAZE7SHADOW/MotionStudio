import { useState } from 'react';
import { Download, Copy, Check, FileJson } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Project } from '@/engines/project';

const FORMATS = [
  { id: 'mp4',  label: 'MP4 · H.264',  codec: 'h264',   ext: 'mp4'  },
  { id: 'webm', label: 'WebM · VP8',   codec: 'vp8',    ext: 'webm' },
  { id: 'gif',  label: 'GIF',          codec: 'gif',    ext: 'gif'  },
  { id: 'mov',  label: 'MOV · ProRes', codec: 'prores', ext: 'mov'  },
] as const;

export default function ExportDialog({ project }: { project: Project }) {
  const [formatId, setFormatId] = useState<string>('mp4');
  const [copied, setCopied] = useState(false);

  const format = FORMATS.find((f) => f.id === formatId) ?? FORMATS[0];
  const command =
    `npx remotion render src/remotion/index.ts MotionStudio ` +
    `out/${project.name || 'video'}.${format.ext} ` +
    `--props=./props.json --codec=${format.codec}`;

  function downloadProps() {
    const props = {
      elements: project.canvas.elements,
      assets: project.assets,
      aspectRatio: project.aspectRatio,
      fps: project.fps,
      durationInFrames: project.durationInFrames,
    };
    const blob = new Blob([JSON.stringify(props, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'props.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const hasMedia = project.assets.length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          title="Export"
          className="h-7 px-3 text-[12px] font-medium bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-studio-panel border-studio-border-strong rounded-studio-xl p-0 gap-0 max-w-md">
        <DialogHeader className="px-5 py-4 border-b border-studio-border">
          <DialogTitle className="text-[14px] font-semibold text-studio-text">
            Export video
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 py-4">
          {/* format */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-studio-text-muted uppercase tracking-wider">
              Format
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormatId(f.id)}
                  className={[
                    'h-8 text-[12px] font-medium rounded-studio-md border transition-colors duration-120',
                    formatId === f.id
                      ? 'bg-studio-accent-subtle border-studio-accent-border text-studio-accent'
                      : 'bg-studio-surface border-studio-border text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* steps */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-studio-text-muted uppercase tracking-wider">
              Render from your terminal
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={downloadProps}
              className="h-8 justify-start gap-2 text-[12px] text-studio-text-muted hover:text-studio-text bg-studio-surface border border-studio-border rounded-studio-md"
            >
              <FileJson className="w-3.5 h-3.5" />
              1 · Download props.json
            </Button>

            <div className="relative">
              <pre className="text-[11px] font-mono text-studio-text-secondary bg-studio-surface border border-studio-border rounded-studio-md p-2.5 pr-9 whitespace-pre-wrap break-all leading-relaxed">
                {command}
              </pre>
              <button
                type="button"
                onClick={copyCommand}
                title="Copy command"
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-studio-xs text-studio-text-faint hover:text-studio-text hover:bg-studio-overlay transition-colors duration-120"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-studio-accent" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {hasMedia && (
            <p className="text-[11px] text-studio-text-faint leading-relaxed border-t border-studio-border pt-3">
              Note: uploaded media uses in-browser <span className="font-mono">blob:</span> URLs
              the renderer can't read. Replace the <span className="font-mono">assets[].url</span>{' '}
              in props.json with real file paths or http URLs before rendering. Text and
              animations render as-is.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
