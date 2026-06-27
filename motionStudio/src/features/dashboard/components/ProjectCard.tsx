import { useNavigate } from 'react-router-dom';
import type { Project } from '@/engines/project';

interface ProjectCardProps {
  project: Project;
}

const RATIO_DISPLAY: Record<string, { label: string; w: number; h: number }> = {
  '16:9': { label: 'Landscape', w: 16, h: 9 },
  '9:16': { label: 'Portrait',  w: 9,  h: 16 },
  '1:1':  { label: 'Square',    w: 1,  h: 1 },
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const ratio = RATIO_DISPLAY[project.aspectRatio];

  const formatted = new Date(project.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <button
      type="button"
      onClick={() => navigate(`/editor/${project.id}`)}
      className="group text-left rounded-studio-lg bg-studio-surface border border-studio-border hover:border-studio-border-strong hover:bg-studio-surface-hover transition-colors duration-[180ms] overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-studio-accent"
    >
      {/* Thumbnail */}
      <div
        className="w-full bg-studio-bg flex items-center justify-center border-b border-studio-border"
        style={{ aspectRatio: `${ratio.w} / ${Math.min(ratio.h, ratio.w * 1.5)}` }}
      >
        <span className="text-[11px] font-mono text-studio-text-faint">{project.aspectRatio}</span>
      </div>

      {/* Metadata */}
      <div className="px-3 py-2.5">
        <p className="text-[13px] font-medium text-studio-text truncate leading-snug">
          {project.name}
        </p>
        <p className="text-[11px] text-studio-text-faint mt-0.5 leading-snug">
          {ratio.label} · {project.fps} fps · {formatted}
        </p>
      </div>
    </button>
  );
}
