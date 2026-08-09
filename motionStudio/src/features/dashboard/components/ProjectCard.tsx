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
import ProjectThumbnail from './ProjectThumbnail';

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
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const formatted = new Date(project.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    track.projectDeleted();
    const result = await deleteProjectCompletely(project);
    setDeleting(false);
    // Stay open on failure. Closing the dialog here read as success while the
    // project was still there, so the only feedback was it reappearing later.
    if (!result.ok) {
      setDeleteError(result.message);
      return;
    }
    setConfirmOpen(false);
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/editor/${project.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/editor/${project.id}`); }
        }}
        className="group relative text-left rounded-studio-lg bg-studio-surface border border-studio-border hover:border-studio-border-strong hover:bg-studio-surface-hover transition-colors ease-studio overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-studio-accent"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmOpen(true);
          }}
          title="Delete project"
          aria-label="Delete project"
          className="absolute top-2 right-2 z-10 flex items-center justify-center size-7 rounded-studio-md bg-studio-bg/80 border border-studio-border text-studio-text-faint opacity-0 group-hover:opacity-100 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all focus-visible:opacity-100 ease-studio"
        >
          <Trash2 className="size-3.5" />
        </button>

        {/* Thumbnail — a real frame of the project, animating on hover.
            True aspect ratio: cards are grouped by format now, so a tall
            portrait card no longer makes the grid ragged and doesn't need
            the squash that used to hide it. */}
        <div
          className="w-full bg-studio-bg border-b border-studio-border overflow-hidden"
          style={{ aspectRatio: `${ratio.w} / ${ratio.h}` }}
        >
          <ProjectThumbnail project={project} />
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
            {/* Says only what actually happens. This used to claim the assets
                were removed "everywhere — this device, the cloud"; the S3
                originals are in fact retained (`deleteAssetFromStorage` is a
                stub), so the promise was false. */}
            <DialogDescription className="text-studio-text-muted">
              This removes the project and its media from this device and from your account,
              including any other browser you’re signed into. This can’t be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <p role="alert" className="text-[12px] text-red-400 leading-snug">
              Couldn’t delete this project — {deleteError}. It’s still here; try again once
              you’re back online.
            </p>
          )}

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
