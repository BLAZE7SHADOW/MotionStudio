import { useProjectStore } from '@/engines/project';

interface CanvasPanelProps {
  projectId: string;
}

const ASPECT_DIMS: Record<string, { w: number; h: number }> = {
  '16:9': { w: 16, h: 9 },
  '9:16': { w: 9,  h: 16 },
  '1:1':  { w: 1,  h: 1 },
};

export default function CanvasPanel({ projectId }: CanvasPanelProps) {
  const project = useProjectStore((s) => s.getProject(projectId));

  if (!project) return null;

  const dims = ASPECT_DIMS[project.aspectRatio];
  const pad = 48;

  return (
    <div className="flex-1 flex items-center justify-center bg-studio-bg overflow-hidden">
      <div
        className="relative bg-white"
        style={{
          aspectRatio: `${dims.w} / ${dims.h}`,
          maxWidth:  `calc(100% - ${pad * 2}px)`,
          maxHeight: `calc(100% - ${pad * 2}px)`,
          width:  dims.w >= dims.h ? '100%' : 'auto',
          height: dims.w <  dims.h ? '100%' : 'auto',
          boxShadow: '0 0 0 1px oklch(1 0 0 / 8%), 0 8px 32px oklch(0 0 0 / 70%)',
          borderRadius: 2,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[12px] text-black/20 font-mono select-none">
            {project.aspectRatio} · {project.fps} fps
          </span>
        </div>
      </div>
    </div>
  );
}
