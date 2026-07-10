import { useState } from 'react';
import { Download, Loader2, MonitorDown } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getCompositionDimensions } from '@/engines/project';
import { exportComposition, downloadBlob, isExportSupported } from '@/engines/export';
import type { Project } from '@/engines/project';

const RESOLUTIONS = [
  { id: 'full', label: 'Full', scale: 1 },
  { id: 'high', label: '75%',  scale: 0.75 },
  { id: 'half', label: '50%',  scale: 0.5 },
] as const;

const QUALITIES = [
  { id: 'max',    label: 'Max',    bps: 40_000_000 },
  { id: 'high',   label: 'High',   bps: 20_000_000 },
  { id: 'medium', label: 'Medium', bps: 10_000_000 },
  { id: 'low',    label: 'Low',    bps: 5_000_000 },
] as const;

export default function ExportDialog({ project }: { project: Project }) {
  const [resolutionId, setResolutionId] = useState<string>('full');
  const [qualityId, setQualityId] = useState<string>('high');
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dims = getCompositionDimensions(project.aspectRatio);
  const supported = isExportSupported();
  const exporting = progress !== null;

  async function handleExport() {
    const resolution = RESOLUTIONS.find((r) => r.id === resolutionId) ?? RESOLUTIONS[0];
    const quality = QUALITIES.find((q) => q.id === qualityId) ?? QUALITIES[0];
    setError(null);
    setProgress(0);
    try {
      const { blob, extension } = await exportComposition(project, {
        resolutionScale: resolution.scale,
        videoBitsPerSecond: quality.bps,
        onProgress: (frame, total) => setProgress(Math.round((frame / total) * 100)),
      });
      downloadBlob(blob, `${project.name || 'video'}.${extension}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setProgress(null);
    }
  }

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
            Export video · MP4
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 py-4">
          {/* Resolution */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-studio-text-muted uppercase tracking-wider">
              Resolution
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {RESOLUTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={exporting}
                  onClick={() => setResolutionId(r.id)}
                  className={[
                    'h-8 text-[11px] font-medium rounded-studio-md border transition-colors duration-120 disabled:opacity-40',
                    resolutionId === r.id
                      ? 'bg-studio-accent-subtle border-studio-accent-border text-studio-accent'
                      : 'bg-studio-surface border-studio-border text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong',
                  ].join(' ')}
                >
                  {r.label} · {Math.round(dims.height * r.scale)}p
                </button>
              ))}
            </div>
          </div>

          {/* Quality (encoder bitrate) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-studio-text-muted uppercase tracking-wider">
              Quality
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {QUALITIES.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  disabled={exporting}
                  onClick={() => setQualityId(q.id)}
                  className={[
                    'h-8 text-[11px] font-medium rounded-studio-md border transition-colors duration-120 disabled:opacity-40',
                    qualityId === q.id
                      ? 'bg-studio-accent-subtle border-studio-accent-border text-studio-accent'
                      : 'bg-studio-surface border-studio-border text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong',
                  ].join(' ')}
                >
                  {q.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-studio-text-faint">
              {(QUALITIES.find((q) => q.id === qualityId)?.bps ?? 0) / 1_000_000} Mbps ·
              frame-perfect offline encode — nothing is dropped or rushed.
            </p>
          </div>

          {/* Export */}
          <Button
            type="button"
            onClick={handleExport}
            disabled={exporting || !supported}
            className="h-9 text-[12px] font-medium bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md gap-1.5 disabled:opacity-70"
          >
            {exporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Rendering… {progress}%
              </>
            ) : (
              <>
                <MonitorDown className="w-3.5 h-3.5" />
                Export & download
              </>
            )}
          </Button>

          {!supported && (
            <p className="text-[11px] text-studio-text-faint leading-relaxed">
              Your browser doesn't support WebCodecs. Use Chrome or Edge to export.
            </p>
          )}

          {error && (
            <p className="text-[11px] text-red-400 leading-relaxed">{error}</p>
          )}

          <p className="text-[10px] text-studio-text-faint leading-relaxed">
            Renders every frame exactly, then encodes — video only (audio coming later).
            Uploaded media is included.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
