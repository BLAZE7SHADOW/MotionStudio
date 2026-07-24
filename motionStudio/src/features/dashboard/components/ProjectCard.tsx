import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Loader2 } from 'lucide-react';
import type { Project } from '@/engines/project';
import { deleteProjectCompletely } from '@/engines/project';
import { track } from '@/lib/analytics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatted = new Date(project.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  async function handleDelete() {
    setDeleting(true);
    track.projectDeleted();
    await deleteProjectCompletely(project);
    setDeleting(false);
    setConfirmOpen(false);
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/editor/${project.id}`)}
        onKeyDown={(e) => e.key === 'Enter' && navigate(`/editor/${project.id}`)}
        className="group relative text-left rounded-studio-lg bg-studio-surface border border-studio-border hover:border-studio-border-strong hover:bg-studio-surface-hover transition-colors duration-[180ms] overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-studio-accent"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmOpen(true);
          }}
          title="Delete project"
          className="absolute top-2 right-2 z-10 flex items-center justify-center size-7 rounded-studio-md bg-studio-bg/80 border border-studio-border text-studio-text-faint opacity-0 group-hover:opacity-100 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all focus-visible:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>

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
      </div>

      <Dialog open={confirmOpen} onOpenChange={(v) => !deleting && setConfirmOpen(v)}>
        <DialogContent className="sm:max-w-95 bg-studio-panel border-studio-border-strong">
          <DialogHeader>
            <DialogTitle className="text-studio-text">Delete “{project.name}”?</DialogTitle>
            <DialogDescription className="text-studio-text-muted">
              This removes the project and its assets everywhere — this device, the cloud, and any
              other signed-in browser. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
              className="text-studio-text-muted hover:text-studio-text hover:bg-studio-surface"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
